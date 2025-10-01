import { NextRequest, NextResponse } from 'next/server';
import { generateForwardTwiML } from '@/lib/twilio/twiml';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    
    console.log('Outbound TwiML request:', { to, from });
    
    // Generate TwiML for outbound call forwarding
    // This will connect the call to the agent's phone
    const twiml = generateForwardTwiML(to);
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error generating outbound TwiML:', error);
    
    // Return a simple error TwiML
    const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, but we cannot complete your call at this time. Please try again later.</Say>
  <Hangup />
</Response>`;
    
    return new NextResponse(errorTwiML, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}
