import { NextRequest } from "next/server";
import { withWebhookSecurity } from "@/lib/api/webhook-handler";
import { db } from "@/lib/db";
import { messageStatusWebhookSchema } from "@/lib/validations/message";
import { MessageStatus } from "@prisma/client";
import { quickbaseService } from "@/lib/quickbase/service";
import { 
  broadcastMessageStatusChanged,
  broadcastConversationUpdated 
} from "@/lib/socket/events";
import { isTestMode, logTestModeActivity } from '@/lib/test-mode';

export async function POST(request: NextRequest) {
  return withWebhookSecurity(request, async (params) => {
    try {
      // Validate webhook payload
      const webhookData = messageStatusWebhookSchema.parse({
        MessageSid: params.get('MessageSid'),
        MessageStatus: params.get('MessageStatus'),
        To: params.get('To'),
        From: params.get('From'),
        Body: params.get('Body'),
        NumSegments: params.get('NumSegments'),
        NumMedia: params.get('NumMedia'),
        ErrorCode: params.get('ErrorCode'),
        ErrorMessage: params.get('ErrorMessage'),
        Price: params.get('Price'),
        PriceUnit: params.get('PriceUnit'),
        SmsSid: params.get('SmsSid'),
        SmsMessageSid: params.get('SmsMessageSid'),
        MessagingServiceSid: params.get('MessagingServiceSid'),
        ApiVersion: params.get('ApiVersion'),
        Timestamp: params.get('Timestamp'),
      });

      const {
        MessageSid,
        MessageStatus: twilioStatus,
        ErrorCode,
        ErrorMessage,
        Price,
        PriceUnit,
        NumSegments,
        Timestamp,
      } = webhookData;

      // Map Twilio status to our MessageStatus enum
      let status: MessageStatus;
      switch (twilioStatus) {
        case 'queued':
        case 'sending':
          status = MessageStatus.QUEUED;
          break;
        case 'sent':
          status = MessageStatus.SENT;
          break;
        case 'delivered':
          status = MessageStatus.DELIVERED;
          break;
        case 'undelivered':
          status = MessageStatus.UNDELIVERED;
          break;
        case 'failed':
          status = MessageStatus.FAILED;
          break;
        default:
          status = MessageStatus.QUEUED;
      }

      // Find the message by Twilio MessageSid
      const message = await db.message.findFirst({
        where: { twilioMessageSid: MessageSid },
      });

      if (!message) {
        console.warn(`Message not found for Twilio SID: ${MessageSid}`);
        return { success: false, error: 'Message not found' };
      }

      // Prepare update data
      const updateData: any = {
        status,
        errorCode: ErrorCode || null,
        errorMessage: ErrorMessage || null,
        price: Price || null,
        priceUnit: PriceUnit || null,
        numSegments: NumSegments ? parseInt(NumSegments) : null,
      };

      // Set timestamps based on status
      const timestamp = Timestamp ? new Date(Timestamp) : new Date();
      
      switch (status) {
        case MessageStatus.SENT:
          updateData.sentAt = timestamp;
          break;
        case MessageStatus.DELIVERED:
          updateData.deliveredAt = timestamp;
          break;
      }

      // Update the message
      const updatedMessage = await db.message.update({
        where: { id: message.id },
        data: updateData,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              quickbaseId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log(`Updated message ${message.id} status to ${status}`);

      // Broadcast message status changed event
      broadcastMessageStatusChanged({
        id: updatedMessage.id,
        messageSid: updatedMessage.twilioMessageSid,
        from: updatedMessage.fromNumber,
        to: updatedMessage.toNumber,
        body: updatedMessage.body,
        direction: updatedMessage.direction.toLowerCase() as any,
        status: status.toLowerCase() as any,
        conversationId: undefined, // TODO: Implement conversation tracking
        customerId: updatedMessage.contactId,
        customerName: updatedMessage.contact?.firstName && updatedMessage.contact?.lastName ? 
          `${updatedMessage.contact.firstName} ${updatedMessage.contact.lastName}` : undefined,
        department: updatedMessage.contact?.department,
        assignedTo: updatedMessage.userId,
        createdAt: updatedMessage.createdAt.toISOString(),
        updatedAt: updatedMessage.updatedAt.toISOString()
      });
      
      // Log SMS communication activity to Quickbase when message is delivered or fails
      if ((status === MessageStatus.DELIVERED || status === MessageStatus.FAILED || status === MessageStatus.UNDELIVERED) && updatedMessage.contact?.quickbaseId) {
        try {
          const communicationStatus = status === MessageStatus.DELIVERED ? 'completed' : 'failed';

          await quickbaseService.logCommunication({
            customerId: updatedMessage.contact.quickbaseId,
            type: 'sms',
            direction: updatedMessage.direction === 'INBOUND' ? 'inbound' : 'outbound',
            status: communicationStatus,
            timestamp: new Date(),
            notes: status === MessageStatus.FAILED ? `SMS failed: ${ErrorMessage || 'Unknown error'}` : undefined
          });

          console.log(`Logged SMS communication to Quickbase for customer ${updatedMessage.contact.quickbaseId}`);
        } catch (error) {
          console.error('Error logging SMS communication to Quickbase:', error);
          // Don't fail the webhook if Quickbase logging fails
        }
      }
      
      // Log status change for debugging
      if (status === MessageStatus.FAILED || status === MessageStatus.UNDELIVERED) {
        console.error(`Message ${message.id} failed:`, {
          errorCode: ErrorCode,
          errorMessage: ErrorMessage,
          contact: updatedMessage.contact,
        });
      }

      // In TEST_MODE, return JSON response for easier testing
      if (isTestMode()) {
        logTestModeActivity('MessageStatusWebhook', 'processed', {
          messageSid: webhookData.MessageSid,
          messageStatus: webhookData.MessageStatus,
          from: webhookData.From,
          to: webhookData.To,
          errorCode: webhookData.ErrorCode,
          errorMessage: webhookData.ErrorMessage,
          messageId: message.id,
          status
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Message status webhook processed successfully',
          data: {
            messageSid: webhookData.MessageSid,
            messageStatus: webhookData.MessageStatus,
            from: webhookData.From,
            to: webhookData.To,
            errorCode: webhookData.ErrorCode,
            errorMessage: webhookData.ErrorMessage,
            messageId: message.id,
            status
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return { success: true, messageId: message.id, status };
    } catch (error) {
      console.error('Error processing message status webhook:', error);
      throw error;
    }
  });
}
