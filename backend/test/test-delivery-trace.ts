import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

async function traceDelivery() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'CloudRage <onboarding@resend.dev>';
  const accountOwner = 'ujjawalagrawal01032007@gmail.com';
  const timestamp = new Date().toISOString();
  const uniqueSubject = `CloudRage DELIVERY TEST ${timestamp}`;

  console.log('=== REAL-TIME RESEND DELIVERY TEST ===');
  console.log('Timestamp:', timestamp);
  console.log('Sender:', fromEmail);
  console.log('Recipient (Masked):', maskEmail(accountOwner));
  console.log('Unique Search Subject:', uniqueSubject);

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [accountOwner],
    subject: uniqueSubject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f5; color: #18181b;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #2563eb;">CloudRage Delivery Verification</h2>
          <p>This is a live test email sent to verify physical mailbox delivery.</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Sender:</strong> ${fromEmail}</p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 13px; color: #71717a;">
            If this email landed in your Spam, Junk, or Promotions folder, please mark it as "Not Spam" or move it to Primary.
          </p>
        </div>
      </div>
    `,
    text: `CloudRage Delivery Verification\n\nTimestamp: ${timestamp}\nSender: ${fromEmail}\n\nIf you see this, delivery succeeded.`,
  });

  if (error) {
    console.error('RESEND STATUS: REJECTED');
    console.error('Error Code:', (error as any).statusCode || 400);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    return;
  }

  console.log('RESEND STATUS: ACCEPTED BY PROVIDER');
  console.log('Resend Email ID:', data?.id);
  console.log('\nSearch your mailbox for:');
  console.log(`"${uniqueSubject}"`);
  console.log('Also check: Spam, Junk, Promotions, and All Mail.');
}

traceDelivery();
