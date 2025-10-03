import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@teamflow.dev' },
    update: {},
    create: {
      email: 'demo@teamflow.dev',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('password123', 10),
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create demo workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      description: 'A demo workspace for testing',
      ownerId: demoUser.id,
    },
  });

  console.log('✅ Created demo workspace:', demoWorkspace.name);

  // Add user as workspace member
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      workspaceId: demoWorkspace.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Added user to workspace as OWNER');

  // Create demo project
  const demoProject = await prisma.project.upsert({
    where: { id: 'demo-project-id' },
    update: {},
    create: {
      id: 'demo-project-id',
      workspaceId: demoWorkspace.id,
      name: 'Demo Project',
      description: 'A demo project for testing',
      icon: '🚀',
      visibility: 'PUBLIC',
      createdBy: demoUser.id,
    },
  });

  console.log('✅ Created demo project:', demoProject.name);

  // Create demo labels
  const labels = await Promise.all([
    prisma.label.upsert({
      where: {
        workspaceId_name: {
          workspaceId: demoWorkspace.id,
          name: 'Bug',
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: 'Bug',
        color: '#EF4444',
      },
    }),
    prisma.label.upsert({
      where: {
        workspaceId_name: {
          workspaceId: demoWorkspace.id,
          name: 'Feature',
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: 'Feature',
        color: '#3B82F6',
      },
    }),
    prisma.label.upsert({
      where: {
        workspaceId_name: {
          workspaceId: demoWorkspace.id,
          name: 'Enhancement',
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: 'Enhancement',
        color: '#10B981',
      },
    }),
  ]);

  console.log('✅ Created demo labels:', labels.length);

  // Create demo tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: demoProject.id,
        title: 'Setup authentication system',
        description: 'Implement JWT-based authentication with email and OAuth providers',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        storyPoints: 8,
        createdBy: demoUser.id,
        position: 0,
      },
    }),
    prisma.task.create({
      data: {
        projectId: demoProject.id,
        title: 'Design kanban board UI',
        description: 'Create responsive kanban board with drag-and-drop functionality',
        status: 'TODO',
        priority: 'MEDIUM',
        storyPoints: 5,
        createdBy: demoUser.id,
        position: 1,
      },
    }),
    prisma.task.create({
      data: {
        projectId: demoProject.id,
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        status: 'DONE',
        priority: 'MEDIUM',
        storyPoints: 3,
        createdBy: demoUser.id,
        position: 2,
      },
    }),
  ]);

  console.log('✅ Created demo tasks:', tasks.length);

  // Assign tasks to demo user
  for (const task of tasks) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task.id,
        userId: demoUser.id,
      },
    });
  }

  console.log('✅ Assigned tasks to demo user');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
