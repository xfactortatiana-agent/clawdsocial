import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

// X webhook for post status updates
// Docs: https://docs.x.com/x-api/webhooks/quickstart
// IMPORTANT: Use X_CLIENT_SECRET as the webhook secret!

// GET - Webhook verification (CRC challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get('crc_token');
  
  // X uses the app's consumer secret (X_CLIENT_SECRET) for webhooks
  // NOT a separate webhook secret
  const consumerSecret = process.env.X_CLIENT_SECRET;
  
  if (!consumerSecret) {
    console.error('X_CLIENT_SECRET not set');
    return NextResponse.json({ error: 'Consumer secret not configured' }, { status: 500 });
  }
  
  // Debug mode
  if (searchParams.get('debug') === 'true') {
    const testToken = crcToken || 'test123';
    const hmac = createHmac('sha256', consumerSecret)
      .update(testToken)
      .digest('base64');
    
    return NextResponse.json({
      using: 'X_CLIENT_SECRET',
      secret_length: consumerSecret.length,
      crc_token: testToken,
      response_token: `sha256=${hmac}`
    });
  }
  
  if (!crcToken) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 });
  }
  
  try {
    // X expects: HMAC-SHA256(crc_token, consumer_secret)
    const hmac = createHmac('sha256', consumerSecret)
      .update(crcToken)
      .digest('base64');
    
    const responseToken = `sha256=${hmac}`;
    
    console.log('CRC Response:', { 
      token_preview: crcToken.substring(0, 20),
      response_preview: responseToken.substring(0, 30)
    });
    
    return NextResponse.json({ 
      response_token: responseToken 
    });
  } catch (error) {
    console.error('CRC error:', error);
    return NextResponse.json({ error: 'CRC failed' }, { status: 500 });
  }
}

// POST - Handle webhook events
export async function POST(req: NextRequest) {
  try {
    // Verify signature
    const signature = req.headers.get('x-twitter-webhooks-signature');
    const consumerSecret = process.env.X_CLIENT_SECRET;
    
    if (signature && consumerSecret) {
      const body = await req.text();
      const expected = `sha256=${createHmac('sha256', consumerSecret).update(body).digest('base64')}`;
      
      if (signature !== expected) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      // Re-parse body after verification
      const event = JSON.parse(body);
      
      console.log('Webhook event:', event.event);
      
      switch (event.event) {
        case 'tweet.create':
          await prisma.post.updateMany({
            where: { platformPostId: event.tweet?.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
              postUrl: `https://twitter.com/i/web/status/${event.tweet?.id}`
            }
          });
          break;
          
        case 'tweet.delete':
          await prisma.post.updateMany({
            where: { platformPostId: event.tweet?.id },
            data: { status: 'FAILED' }
          });
          break;
          
        default:
          console.log('Unhandled event:', event.event);
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
