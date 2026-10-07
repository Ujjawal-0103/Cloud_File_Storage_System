import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

async function run() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'CloudRage <onboarding@resend.dev>';
  const frontendUrl = process.env.FRONTEND_URL;

  console.log('--- Resend Environment Diagnostics ---');
  console.log('RESEND_API_KEY loaded:', Boolean(apiKey));
  console.log('RESEND_FROM_EMAIL loaded:', Boolean(fromEmail), `(${fromEmail})`);
  console.log('FRONTEND_URL loaded:', Boolean(frontendUrl), `(${frontendUrl})`);

  if (!apiKey) {
    console.error('ERROR: RESEND_API_KEY is not set');
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  console.log('\n--- Sending Test Email via Official Resend SDK ---');
  console.log('Target recipient: delivered@resend.dev');

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: ['delivered@resend.dev'],
      subject: 'CloudRage Resend Test',
      html: '<p>CloudRage Resend integration test.</p>',
    });

    if (error) {
      console.error('Resend returned error:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      process.exit(1);
    }

    console.log('Resend accepted request successfully!');
    console.log('Resend Email ID:', data?.id);
    console.log('Phase 5 Test Passed!');
  } catch (err: any) {
    console.error('Exception thrown while sending test email:');
    console.error(err?.message || err);
    process.exit(1);
  }
}

run();
