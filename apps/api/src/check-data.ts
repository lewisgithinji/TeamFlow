import { prisma } from '@teamflow/database';

async function checkData() {
  console.log('🔍 Checking database for existing data...\n');

  const [users, workspaces, projects, tasks] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.project.count(),
    prisma.task.count(),
  ]);

  console.log('Database Statistics:');
  console.log(`  Users: ${users}`);
  console.log(`  Workspaces: ${workspaces}`);
  console.log(`  Projects: ${projects}`);
  console.log(`  Tasks: ${tasks}`);

  if (workspaces > 0) {
    console.log('\n📦 Found workspaces! Listing them:');
    const allWorkspaces = await prisma.workspace.findMany({
      include: {
        _count: {
          select: {
            projects: true,
            members: true,
          },
        },
      },
    });

    allWorkspaces.forEach((workspace, index) => {
      console.log(`\n${index + 1}. ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Members: ${workspace._count.members}`);
      console.log(`   Projects: ${workspace._count.projects}`);
      console.log(`   Created: ${workspace.createdAt.toLocaleString()}`);
    });

    // Check workspace memberships
    console.log('\n👥 Checking workspace memberships...');
    const memberships = await prisma.workspaceMember.findMany({
      include: {
        user: {
          select: { email: true, name: true },
        },
        workspace: {
          select: { name: true },
        },
      },
    });

    if (memberships.length > 0) {
      console.log(`\nFound ${memberships.length} membership(s):`);
      memberships.forEach((m) => {
        console.log(`  - ${m.user.name} (${m.user.email}) → ${m.workspace.name} [${m.role}]`);
      });
    } else {
      console.log('\n❌ No workspace memberships found!');
      console.log('💡 This means workspaces exist but are not connected to any users.');
    }
  } else {
    console.log('\n❌ No workspaces found in database');
    console.log('💡 It appears the database has been reset or cleared.');
  }
}

checkData()
  .catch((error) => {
    console.error('❌ Error:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
