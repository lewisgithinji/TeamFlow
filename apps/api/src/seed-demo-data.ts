import { prisma, WorkspaceRole } from '@teamflow/database';
import bcrypt from 'bcryptjs';

async function seedDemoData() {
  console.log('🌱 Seeding demo data...\n');

  const email = 'demo@teamflow.dev';
  const password = 'password123';

  // 1. Create or get demo user
  console.log('👤 Creating demo user...');
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        name: 'Demo User',
        passwordHash,
        provider: 'email',
        emailVerified: true,
      },
    });
    console.log('✅ User created:', user.email);
  } else {
    // Update password to ensure it works
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
      },
    });
    console.log('✅ User updated:', user.email);
  }

  // 2. Create or get workspace
  console.log('\n🏢 Creating workspace...');
  let workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-workspace' },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Demo Workspace',
        slug: 'demo-workspace',
        description: 'A demo workspace for testing TeamFlow features',
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });
    console.log('✅ Workspace created:', workspace.name);
  } else {
    console.log('✅ Workspace already exists:', workspace.name);
  }

  // 3. Create projects
  console.log('\n📁 Creating projects...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UI',
      workspaceId: workspace.id,
      createdBy: user.id,
    },
  });
  console.log('✅ Project created:', project1.name);

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Build a mobile app for iOS and Android',
      workspaceId: workspace.id,
      createdBy: user.id,
    },
  });
  console.log('✅ Project created:', project2.name);

  // 4. Create tasks
  console.log('\n✅ Creating tasks...');

  const tasks = [
    // Website Redesign tasks
    {
      title: 'Design new homepage',
      description: 'Create mockups for the new homepage design',
      status: 'TODO',
      priority: 'HIGH',
      projectId: project1.id,
      createdBy: user.id,
      position: 0,
    },
    {
      title: 'Update color scheme',
      description: 'Choose and implement new brand colors',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: project1.id,
      createdBy: user.id,
      position: 0,
    },
    {
      title: 'Implement responsive design',
      description: 'Make the website mobile-friendly',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project1.id,
      createdBy: user.id,
      position: 0,
    },
    // Mobile App tasks
    {
      title: 'Set up React Native project',
      description: 'Initialize the React Native project structure',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project2.id,
      createdBy: user.id,
      position: 0,
    },
    {
      title: 'Design app navigation',
      description: 'Create the main navigation flow',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project2.id,
      createdBy: user.id,
      position: 1,
    },
    {
      title: 'Implement authentication',
      description: 'Add login and signup functionality',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project2.id,
      createdBy: user.id,
      position: 0,
    },
  ];

  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        assignees: {
          create: {
            userId: user.id,
          },
        },
      },
    });
    console.log(`  - ${task.title} [${task.status}]`);
  }

  console.log('\n✨ Demo data seeded successfully!\n');
  console.log('📝 Login credentials:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('\n🏢 Workspace:', workspace.name);
  console.log('   ID:', workspace.id);
  console.log('\n📊 Summary:');
  console.log('   - 1 user');
  console.log('   - 1 workspace');
  console.log('   - 2 projects');
  console.log('   - 6 tasks');
  console.log('\n🚀 You can now log in at http://localhost:3001/login');
  console.log('🔧 Test Slack integration at http://localhost:3001/' + workspace.id + '/settings/integrations/slack');
}

seedDemoData()
  .catch((error) => {
    console.error('❌ Error seeding data:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
