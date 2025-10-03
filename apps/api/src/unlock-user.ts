import { prisma } from '@teamflow/database';

async function unlockUser() {
  console.log('🔓 Unlocking demo user account...');

  await prisma.user.update({
    where: { email: 'demo@teamflow.dev' },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  console.log('✅ Account unlocked!');
}

unlockUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
