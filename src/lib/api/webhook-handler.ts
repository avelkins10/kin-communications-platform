import { verifyTwilioSignature } from "@/lib/twilio/signature";
import { prisma } from "@/lib/db";

export async function withWebhookSecurity<T>(
  req: Request,
  processor: (params: FormData) => Promise<T>
): Promise<Response> {
  const signature = req.headers.get('X-Twilio-Signature');
  const url = req.url;
  const params = await req.formData();
  
  if (!signature || !verifyTwilioSignature({ url, params, signature })) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const webhookId = params.get('CallSid') || params.get('MessageSid') || params.get('TaskSid');
  if (!webhookId || typeof webhookId !== 'string') {
    return new Response('Missing webhook ID', { status: 400 });
  }
  
  // Idempotency check
  const processed = await prisma.webhookLog.findUnique({
    where: { webhookId }
  });
  if (processed) {
    return new Response('OK');
  }
  
  try {
    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.webhookLog.create({ data: { webhookId } });
      return await processor(params);
    });
    
    return new Response('OK');
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
