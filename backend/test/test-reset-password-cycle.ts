import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const testEmail = 'trial@gmail.com';
  console.log(`Setting up test token for ${testEmail}...`);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { email: testEmail },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    },
  });

  console.log('1. User updated with valid reset token.');

  // Test reset password
  const newPassword = 'Password_Reset_Success_123!';
  console.log('2. Calling POST /api/auth/reset-password with valid token...');

  const resetRes = await fetch('http://localhost:3001/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: rawToken,
      newPassword,
    }),
  });

  const resetData = await resetRes.json();
  console.log('Reset response status:', resetRes.status);
  console.log('Reset response data:', resetData);

  // Check DB state: token and expires should be null
  const userAfter = await prisma.user.findUnique({
    where: { email: testEmail },
    select: {
      resetPasswordToken: true,
      resetPasswordExpires: true,
      password: true,
    },
  });

  console.log('3. Checking DB invalidation:');
  console.log('resetPasswordToken is null:', userAfter?.resetPasswordToken === null);
  console.log('resetPasswordExpires is null:', userAfter?.resetPasswordExpires === null);

  // Verify new password works by logging in
  console.log('4. Verifying login with the new password...');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('Login token returned:', Boolean(loginData.access_token));

  // Verify reuse fails
  console.log('5. Verifying token reuse fails...');
  const reuseRes = await fetch('http://localhost:3001/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: rawToken,
      newPassword: 'AnotherPassword456!',
    }),
  });
  const reuseData = await reuseRes.json();
  console.log('Reuse status (expected 400):', reuseRes.status);
  console.log('Reuse response:', reuseData);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
