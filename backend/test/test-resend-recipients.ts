import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

function sanitizeEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

async function testRecipient(label: string, recipientEmail: string, resend: Resend, fromEmail: string) {
  console.log(`\n========================================`);
  console.log(`Testing: ${label}`);
  console.log(`Sanitized Recipient: ${sanitizeEmail(recipientEmail)}`);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `CloudRage Delivery Diagnostic - ${label}`,
      html: `<p>CloudRage Resend diagnostic test for ${label}.</p>`,
      text: `CloudRage Resend diagnostic test for ${label}.`,
    });

    if (error) {
      console.log('Result: REJECTED');
      console.log('HTTP Status:', (error as any).statusCode || (error as any).status || 400);
      console.log('Error Name:', error.name);
      console.log('Error Message:', error.message);
      return { label, status: 'REJECTED', error: error.name, message: error.message };
    }

    if (!data?.id) {
      console.log('Result: UNCONFIRMED (No Email ID returned)');
      return { label, status: 'UNCONFIRMED', error: 'No ID returned' };
    }

    console.log('Result: ACCEPTED');
    console.log('Resend Email ID:', data.id);
    return { label, status: 'ACCEPTED', emailId: data.id };
  } catch (err: any) {
    console.log('Result: EXCEPTION');
    console.log('Exception Message:', err?.message || err);
    return { label, status: 'EXCEPTION', error: err?.message };
  }
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'CloudRage <onboarding@resend.dev>';

  console.log('Environment Diagnostics:');
  console.log('RESEND_API_KEY loaded:', Boolean(apiKey));
  console.log('RESEND_FROM_EMAIL loaded:', Boolean(fromEmail));
  console.log('FRONTEND_URL loaded:', Boolean(process.env.FRONTEND_URL));

  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined');
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  // Recipient A: delivered@resend.dev
  await testRecipient('Category A: Resend Test Recipient', 'delivered@resend.dev', resend, fromEmail);

  // Recipient B: Resend Account Owner
  await testRecipient('Category B: Resend Account Owner', 'ujjawalagrawal01032007@gmail.com', resend, fromEmail);

  // Recipient C: Arbitrary External Email
  await testRecipient('Category C: Alternate External Email', 'ujjawalag01@gmail.com', resend, fromEmail);
}

main();
