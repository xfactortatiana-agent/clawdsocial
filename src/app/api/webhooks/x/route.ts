import { NextRequest, NextResponse } from "next/server";
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
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get('crc_token');
  
  if (!crcToken) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 });
  }
  
  // Generate HMAC response
  const crypto = require('crypto');
  const hmac = crypto
    .createHmac('sha256', process.env.X_WEBHOOK_SECRET || '')
    .update(crcToken)
    .digest('base64');
  
  return NextResponse.json({ response_token: `sha256=${hmac}` });
}
