import { verifyTwilioSignature } from "@/lib/twilio/signature";
import { prisma } from "@/lib/db";

// Export webhookHandler as an alias for withWebhookSecurity
export const webhookHandler = withWebhookSecurity;

export async function withWebhookSecurity<T = void>(
  req: Request,
  processor: (params: FormData) => Promise<T>,
  options?: { responseType?: 'json' | 'xml' }
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
    // Return appropriate response type for idempotent requests
    if (options?.responseType === 'xml') {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
    return new Response('OK');
  }
  
  try {
    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.webhookLog.create({ data: { webhookId } });
      return await processor(params);
    });
    
    // Handle response based on type
    if (options?.responseType === 'xml') {
      if (typeof result === 'string') {
        return new Response(result, {
          headers: { 'Content-Type': 'text/xml' }
        });
      }
      // Fallback TwiML if processor didn't return string
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">We\'re sorry, but we\'re experiencing technical difficulties. Please try again later.</Say><Hangup/></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    // Handle error response based on type
    if (options?.responseType === 'xml') {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">We\'re sorry, but we\'re experiencing technical difficulties. Please try again later.</Say><Hangup/></Response>', {
        headers: { 'Content-Type': 'text/xml' },
        status: 500
      });
    }
    
    return new Response('Internal Server Error', { status: 500 });
  }
}
