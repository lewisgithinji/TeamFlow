import { prisma } from '@teamflow/database';

async function listUsers() {
  console.log('📋 Listing all users in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          workspaceMemberships: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found in database');
    return;
  }

  console.log(`✅ Found ${users.length} user(s):\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Workspaces: ${user._count.workspaceMemberships}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    console.log('');
  });

  // Show which user has the most data
  const userWithMostWorkspaces = users.reduce((prev, current) =>
    (prev._count.workspaceMemberships > current._count.workspaceMemberships) ? prev : current
  );

  if (userWithMostWorkspaces._count.workspaceMemberships > 0) {
    console.log(`💡 User with most workspaces: ${userWithMostWorkspaces.name} (${userWithMostWorkspaces._count.workspaceMemberships} workspaces)`);
    console.log(`   This is likely your original demo user!`);
  }
}

listUsers()
  .catch((error) => {
    console.error('❌ Error:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
