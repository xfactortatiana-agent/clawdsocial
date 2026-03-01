import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// Debug endpoint to test CRC generation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get('crc_token') || 'test_token_123';
  
  const secret = process.env.X_WEBHOOK_SECRET || 'default_secret';
  
  // Test multiple approaches
  const results = {
    secret_set: !!process.env.X_WEBHOOK_SECRET,
    secret_length: secret.length,
    crc_token: crcToken,
    approaches: {} as Record<string, string>
  };
  
  // Approach 1: Standard HMAC-SHA256 with secret as-is
  results.approaches['standard'] = `sha256=${createHmac('sha256', secret).update(crcToken).digest('base64')}`;
  
  // Approach 2: Secret as Buffer
  results.approaches['buffer_secret'] = `sha256=${createHmac('sha256', Buffer.from(secret)).update(crcToken).digest('base64')}`;
  
  // Approach 3: Raw digest (no sha256= prefix)
  results.approaches['no_prefix'] = createHmac('sha256', secret).update(crcToken).digest('base64');
  
  // Approach 4: Hex digest
  results.approaches['hex'] = `sha256=${createHmac('sha256', secret).update(crcToken).digest('hex')}`;
  
  return NextResponse.json(results);
}
