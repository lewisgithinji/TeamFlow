import { prisma } from '@teamflow/database';
import bcrypt from 'bcryptjs';

async function createDemoUser() {
  console.log('🚀 Creating demo user...\n');

  const email = 'demo@teamflow.dev';
  const password = 'password123';
  const name = 'Demo User';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('✅ User already exists:', {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
    });

    // Update password anyway to ensure it works
    console.log('\n🔐 Updating password to ensure it works...');
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        emailVerified: true, // Verify email so they can log in
      },
    });
    console.log('✅ Password updated!');

    console.log('\n📝 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    return;
  }

  // Create new user
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      provider: 'email',
      emailVerified: true, // Auto-verify for demo user
    },
  });

  console.log('✅ Demo user created successfully!');
  console.log('\nUser details:', {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
  });

  console.log('\n📝 Login credentials:');
  console.log('Email:', email);
  console.log('Password:', password);

  console.log('\n🎯 You can now log in at http://localhost:3001/login');
}

createDemoUser()
  .catch((error) => {
    console.error('❌ Error creating demo user:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
