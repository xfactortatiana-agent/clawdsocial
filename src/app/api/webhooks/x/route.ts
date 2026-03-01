import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

// X webhook for post status updates
// Docs: https://developer.twitter.com/en/docs/twitter-api/webhooks/overview

// GET - Webhook verification (CRC challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get('crc_token');
  
  // Debug endpoint to test CRC
  if (searchParams.get('debug') === 'true') {
    const testToken = crcToken || 'test123';
    const secret = process.env.X_WEBHOOK_SECRET || '';
    
    // X expects the consumer secret as the key (not the webhook secret)
    // But for Account Activity API, we use the webhook secret
    const hmac = createHmac('sha256', secret).update(testToken).digest('base64');
    
    return NextResponse.json({
      secret_set: !!process.env.X_WEBHOOK_SECRET,
      secret_length: secret.length,
      secret_preview: secret.substring(0, 10) + '...',
      crc_token: testToken,
      response_token: `sha256=${hmac}`,
      note: "If X says invalid, try using X_CLIENT_SECRET instead of X_WEBHOOK_SECRET"
    });
  }
  
  if (!crcToken) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 });
  }
  
  const secret = process.env.X_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('X_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Secret not configured' }, { status: 500 });
  }
  
  try {
    // Generate HMAC-SHA256
    // X Account Activity API uses the webhook secret as the key
    const hmac = createHmac('sha256', secret)
      .update(crcToken)
      .digest('base64');
    
    const responseToken = `sha256=${hmac}`;
    
    console.log('CRC Check:', { 
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
    const body = await req.json();
    
    console.log('Webhook received:', body.event);
    
    switch (body.event) {
      case 'tweet.create':
        await prisma.post.updateMany({
          where: { platformPostId: body.tweet?.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            postUrl: `https://twitter.com/i/web/status/${body.tweet?.id}`
          }
        });
        break;
        
      case 'tweet.delete':
        await prisma.post.updateMany({
          where: { platformPostId: body.tweet?.id },
          data: { status: 'FAILED' }
        });
        break;
        
      default:
        console.log('Unhandled event:', body.event);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
