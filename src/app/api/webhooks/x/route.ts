import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

// X webhook for post status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verify webhook signature (X provides this)
    const signature = req.headers.get('x-twitter-webhook-signature');
    // TODO: Implement signature verification
    
    // Handle different event types
    switch (body.event) {
      case 'tweet.create':
        // Post published successfully
        await prisma.post.updateMany({
          where: { platformPostId: body.tweet.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            postUrl: `https://twitter.com/i/web/status/${body.tweet.id}`
          }
        });
        break;
        
      case 'tweet.delete':
        // Post deleted on X
        await prisma.post.updateMany({
          where: { platformPostId: body.tweet.id },
          data: { status: 'FAILED' }
        });
        break;
        
      default:
        console.log('Unhandled webhook event:', body.event);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Webhook verification (required by X)
// X sends GET request with crc_token to verify the webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get('crc_token');
  
  if (!crcToken) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 });
  }
  
  const secret = process.env.X_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('X_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  
  try {
    // Generate HMAC-SHA256 hash
    // X expects the secret as-is (not base64 decoded)
    const hmac = createHmac('sha256', secret)
      .update(crcToken)
      .digest('base64');
    
    // Return in exact format X expects: sha256=<base64_hmac>
    const responseToken = `sha256=${hmac}`;
    
    console.log('CRC Check:', { crcToken, responseToken });
    
    return NextResponse.json({ 
      response_token: responseToken 
    });
  } catch (error) {
    console.error('CRC generation error:', error);
    return NextResponse.json({ error: 'CRC generation failed' }, { status: 500 });
  }
}
