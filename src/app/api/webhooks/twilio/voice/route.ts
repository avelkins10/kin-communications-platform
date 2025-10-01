import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { answerWithRecording, generateVoicemailTwiML } from '@/lib/twilio/twiml';
import { normalizePhoneToE164, findUserByPhoneNumber } from '@/lib/utils/phone';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { voiceWebhookSchema } from '@/lib/validations/call';
import { quickbaseService } from '@/lib/quickbase/service';
import { routingEngine } from '@/lib/twilio/routing';
import * as Sentry from '@sentry/nextjs';

function generateCuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function POST(req: NextRequest) {
  // withWebhookSecurity handles signature validation, idempotency, and transaction wrapping
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const validatedData = voiceWebhookSchema.parse({
      CallSid: params.get('CallSid'),
      From: params.get('From'),
      To: params.get('To'),
      CallStatus: params.get('CallStatus'),
      Direction: params.get('Direction') as 'inbound' | 'outbound',
      CallerName: params.get('CallerName'),
      CallerCity: params.get('CallerCity'),
      CallerState: params.get('CallerState'),
      CallerCountry: params.get('CallerCountry'),
      CallerZip: params.get('CallerZip'),
      CalledCity: params.get('CalledCity'),
      CalledState: params.get('CalledState'),
      CalledCountry: params.get('CalledCountry'),
      CalledZip: params.get('CalledZip'),
      AccountSid: params.get('AccountSid'),
      ApiVersion: params.get('ApiVersion'),
    });

    const { CallSid: callSid, From: from, To: to, CallStatus: callStatus } = validatedData;

    console.log('Voice webhook received:', { callSid, from, to, callStatus });

    // Normalize phone numbers
    const normalizedFrom = normalizePhoneToE164(from);
    const normalizedTo = normalizePhoneToE164(to);

    // Look up contact by phone number first
    const phoneNumbers = [from, normalizedFrom].filter(Boolean) as string[];
    const contact = await prisma.contact.findFirst({
      where: {
        phone: {
          in: phoneNumbers
        }
      }
    });

    // Determine user assignment
    let assignedUserId: string | null = null;

    // If contact exists and has a project coordinator, assign to them
    if (contact?.projectCoordinatorId) {
      const projectCoordinator = await prisma.user.findUnique({
        where: { id: contact.projectCoordinatorId }
      });

      if (projectCoordinator) {
        assignedUserId = projectCoordinator.id;
        console.log('Assigned call to project coordinator:', projectCoordinator.name);
      }
    }

    // If no coordinator assigned, try to find default employee by phone number
    if (!assignedUserId && process.env.DEFAULT_EMPLOYEE_NUMBER) {
      const defaultUser = await findUserByPhoneNumber(process.env.DEFAULT_EMPLOYEE_NUMBER);
      if (defaultUser) {
        assignedUserId = defaultUser.id;
        console.log('Assigned call to default employee:', defaultUser.name);
      }
    }

    // Create call record in database with user assignment
    let call = await prisma.call.findUnique({
      where: { twilioCallSid: callSid }
    });

    if (!call) {
      // Create the call record
      call = await prisma.call.create({
        data: {
          id: generateCuid(),
          twilioCallSid: callSid,
          direction: 'INBOUND',
          status: 'RINGING',
          fromNumber: from,
          toNumber: to,
          contactId: contact?.id,
          userId: assignedUserId,
          startedAt: new Date(),
        }
      });

      console.log(`Created call record ${call.id} for CallSid ${callSid}${assignedUserId ? ` assigned to user ${assignedUserId}` : ''}`);
    }

    // Route the call using the routing engine
    let routingResult: any = null;
    try {
      routingResult = await routingEngine.routeTask(
        {
          type: 'voice',
          customer_phone: from,
          call_sid: callSid,
        },
        {
          phoneNumber: from,
          callSid: callSid,
          callId: call.id, // Pass local database ID instead of Twilio SID
        }
      );

      // Update call record with task ID if task was created
      if (routingResult.taskId && call) {
        await prisma.call.update({
          where: { id: call.id },
          data: { taskId: routingResult.taskId },
        });
        console.log(`Updated call record ${call.id} with taskId: ${routingResult.taskId}`);
      }
    } catch (error) {
      console.error('Routing engine failed:', error);
      // Continue with existing routing logic
    }

    // Quickbase customer lookup (non-blocking)
    let qbCustomer = null;
    if (process.env.QUICKBASE_ENABLED !== 'false' && normalizedFrom) {
      try {
        qbCustomer = await quickbaseService.findCustomerByPhone(normalizedFrom);
        if (qbCustomer) {
          console.log('Found Quickbase customer:', qbCustomer.id);
        }
      } catch (error) {
        Sentry.addBreadcrumb({
          category: 'quickbase',
          message: 'Customer lookup failed',
          level: 'warning',
          data: { phone: normalizedFrom.slice(-4) }
        });
        console.error('Quickbase customer lookup failed:', error);
        // Continue with existing routing logic
      }
    }

    // Determine routing based on contact and configuration
    let targetNumber = process.env.DEFAULT_EMPLOYEE_NUMBER;
    let routingMessage = "Please hold while we connect you to an available agent.";

    // If Quickbase customer has a project coordinator, prefer that over local contact
    if (qbCustomer?.projectCoordinator) {
      const qbCoordinator = await prisma.user.findUnique({
        where: { quickbaseUserId: qbCustomer.projectCoordinator.id },
        include: {
          PhoneNumber: {
            where: { status: 'active' },
            take: 1
          }
        }
      });

      if (qbCoordinator?.PhoneNumber?.[0]) {
        targetNumber = qbCoordinator.PhoneNumber[0].phoneNumber;
        routingMessage = `Connecting you to your project coordinator, ${qbCustomer.projectCoordinator.name}.`;
        console.log(`Routing to Quickbase project coordinator: ${qbCustomer.projectCoordinator.name} at ${targetNumber}`);
        
        // Update assignedUserId to the Quickbase project coordinator
        assignedUserId = qbCoordinator.id;
        console.log('Assigned call to Quickbase project coordinator:', qbCoordinator.name);
      }
    }
    // Fallback to local contact project coordinator
    else if (contact?.projectCoordinatorId) {
      const projectCoordinator = await prisma.user.findUnique({
        where: { id: contact.projectCoordinatorId },
        include: {
          PhoneNumber: {
            where: { status: 'active' },
            take: 1
          }
        }
      });

      if (projectCoordinator?.PhoneNumber?.[0]) {
        targetNumber = projectCoordinator.PhoneNumber[0].phoneNumber;
        routingMessage = `Connecting you to your project coordinator, ${projectCoordinator.name}.`;
        console.log(`Routing to project coordinator: ${projectCoordinator.name} at ${targetNumber}`);
      }
    }

    // If no specific routing found, use default
    if (!targetNumber) {
      targetNumber = process.env.DEFAULT_EMPLOYEE_NUMBER || '+1234567890';
      console.log(`Using default employee number: ${targetNumber}`);
    }

    // Update call record with final assignedUserId if it changed
    if (call && assignedUserId && call.userId !== assignedUserId) {
      await prisma.call.update({
        where: { id: call.id },
        data: { userId: assignedUserId }
      });
      console.log(`Updated call record ${call.id} with assignedUserId: ${assignedUserId}`);
    }

    // Check if we're within business hours
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isBusinessHours = day >= 1 && day <= 5 && hour >= 8 && hour < 18;

    // Generate TwiML based on business hours and routing result
    let twiml: string;

    if (isBusinessHours) {
      // If TaskRouter task was created, enqueue the call
      if (routingResult?.taskSid && routingResult?.workflowSid) {
        twiml = `<Response>
          <Say>${routingMessage}</Say>
          <Enqueue workflowSid="${routingResult.workflowSid}">${routingResult.taskSid}</Enqueue>
        </Response>`;
        console.log(`Routing call to TaskRouter task: ${routingResult.taskSid}`);
      } else {
        // Fallback to direct forwarding with recording
        twiml = answerWithRecording({
          to: targetNumber,
          from: to,
          timeout: 30,
          timeLimit: 3600
        });

        // Update the greeting message in the TwiML
        twiml = twiml.replace(
          'Thank you for calling. Please hold while we connect you to an available agent.',
          routingMessage
        );
      }
    } else {
      // After hours: go straight to voicemail
      twiml = generateVoicemailTwiML();

      // Mark call as voicemail
      await prisma.call.update({
        where: { id: call.id },
        data: { status: 'VOICEMAIL' }
      });

      console.log('After hours - routing to voicemail');
    }

    console.log('Generated TwiML for call:', callSid);

    // Return TwiML string - withWebhookSecurity will wrap it in Response
    return twiml;
  }, { responseType: 'xml' });
}