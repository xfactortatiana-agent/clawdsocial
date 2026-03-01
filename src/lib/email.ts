interface EmailOptions {
  to: string;
  subject: string;
  content: string;
}

export async function sendNotificationEmail({ to, subject, content }: EmailOptions) {
  // For MVP, log to console. Replace with actual email service (Resend, SendGrid, etc.)
  console.log(`📧 Email to ${to}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${content}`);
  
  // Example with Resend (uncomment when ready):
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'ClawdSocial <notifications@clawdsocial.com>',
    to,
    subject,
    text: content,
    html: `<p>${content}</p>`
  });
  */
  
  return { success: true };
}
