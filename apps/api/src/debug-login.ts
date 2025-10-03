import { prisma } from '@teamflow/database';
import bcrypt from 'bcryptjs';

async function debugLogin() {
  console.log('🔍 Debugging login issue...\n');

  // Find demo user
  const user = await prisma.user.findUnique({
    where: { email: 'demo@teamflow.dev' },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    name: user.name,
    hasPassword: !!user.passwordHash,
    passwordHashLength: user.passwordHash?.length,
    passwordHashPreview: user.passwordHash?.substring(0, 20) + '...',
  });

  if (!user.passwordHash) {
    console.log('❌ No password hash in database!');
    return;
  }

  // Test password verification
  const testPassword = 'password123';
  console.log('\n🔐 Testing password verification...');
  console.log('Test password:', testPassword);

  const isValid = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('Password valid:', isValid);

  if (!isValid) {
    console.log('\n❌ Password verification FAILED');
    console.log('Generating new hash for comparison...');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash:', newHash);
    const newHashValid = await bcrypt.compare(testPassword, newHash);
    console.log('New hash validates:', newHashValid);

    console.log('\n💡 Fixing the password hash...');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    console.log('✅ Password hash updated!');
  } else {
    console.log('\n✅ Password verification SUCCESSFUL');
  }
}

debugLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
