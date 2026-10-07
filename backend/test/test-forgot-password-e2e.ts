import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log('=== Step 1: Testing Forgot Password for Unknown Email (Account Enumeration) ===');
  const resUnknown = await fetch('http://localhost:3001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent-user-12345@test.com' }),
  });
  const dataUnknown = await resUnknown.json();
  console.log('Status:', resUnknown.status);
  console.log('Response:', dataUnknown);

  console.log('\n=== Step 2: Testing Forgot Password for Existing User (ujjawalagrawal01032007@gmail.com) ===');
  const targetEmail = 'ujjawalagrawal01032007@gmail.com';
  const resReal = await fetch('http://localhost:3001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail }),
  });
  const dataReal = await resReal.json();
  console.log('Status:', resReal.status);
  console.log('Response:', dataReal);

  console.log('\n=== Step 3: Verifying Database Token Persistence and Expiry ===');
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: {
      id: true,
      email: true,
      resetPasswordToken: true,
      resetPasswordExpires: true,
    },
  });

  console.log('User found in DB:', user?.email);
  console.log('Reset token exists in DB:', Boolean(user?.resetPasswordToken));
  console.log('Reset expires:', user?.resetPasswordExpires);
  const isFuture = user?.resetPasswordExpires && new Date(user.resetPasswordExpires) > new Date();
  console.log('Expires in future (> now):', isFuture);

  console.log('\n=== Step 4: Testing Reset Password with Invalid Token ===');
  const resInvalid = await fetch('http://localhost:3001/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'completely-bogus-token-123', newPassword: 'NewSecurePassword123!' }),
  });
  const dataInvalid = await resInvalid.json();
  console.log('Invalid Token Status:', resInvalid.status);
  console.log('Invalid Token Response:', dataInvalid);

  console.log('\n=== End-to-End Verification Complete ===');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
