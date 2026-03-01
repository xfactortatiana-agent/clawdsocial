import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

// GET - Webhook verification (required by X)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get('crc_token');
  
  // Debug mode - show all CRC attempts
  if (searchParams.get('debug') === 'true') {
    const testToken = crcToken || 'test123';
    const secret = process.env.X_WEBHOOK_SECRET || 'test_secret';
    
    return NextResponse.json({
      secret_set: !!process.env.X_WEBHOOK_SECRET,
      secret_length: secret.length,
      crc_token: testToken,
      results: {
        standard: `sha256=${createHmac('sha256', secret).update(testToken).digest('base64')}`,
        no_prefix: createHmac('sha256', secret).update(testToken).digest('base64'),
        hex: `sha256=${createHmac('sha256', secret).update(testToken).digest('hex')}`,
      }
    });
  }
  
  // Normal CRC verification
  if (!crcToken) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 });
  }
  
  const secret = process.env.X_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('X_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  
  try {
    const hmac = createHmac('sha256', secret)
      .update(crcToken)
      .digest('base64');
    
    const responseToken = `sha256=${hmac}`;
    
    console.log('CRC Response:', { 
      crc_token: crcToken.substring(0, 20) + '...',
      response_token: responseToken.substring(0, 30) + '...'
    });
    
    return NextResponse.json({ 
      response_token: responseToken 
    });
  } catch (error) {
    console.error('CRC error:', error);
    return NextResponse.json({ error: 'CRC generation failed' }, { status: 500 });
  }
}

// POST - Handle webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    switch (body.event) {
      case 'tweet.create':
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
        await prisma.post.updateMany({
          where: { platformPostId: body.tweet.id },
          data: { status: 'FAILED' }
        });
        break;
        
      default:
        console.log('Webhook event:', body.event);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
