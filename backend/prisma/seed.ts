import { PrismaClient, TaskStatus, TaskPriority, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Seeding database...');

  // Cleanup order (FK safe)
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const hash = (p: string) => bcrypt.hash(p, 10);

  // --- Users ---
  const [admin, pm1, pm2, dev1, dev2, dev3, dev4] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@agency.com', passwordHash: await hash('password123'), role: Role.ADMIN, name: 'Alex Admin' } }),
    prisma.user.create({ data: { email: 'pm1@agency.com', passwordHash: await hash('password123'), role: Role.PM, name: 'Priya Manager' } }),
    prisma.user.create({ data: { email: 'pm2@agency.com', passwordHash: await hash('password123'), role: Role.PM, name: 'Sam Silva' } }),
    prisma.user.create({ data: { email: 'dev1@agency.com', passwordHash: await hash('password123'), role: Role.DEV, name: 'Ravi Dev' } }),
    prisma.user.create({ data: { email: 'dev2@agency.com', passwordHash: await hash('password123'), role: Role.DEV, name: 'Mia Coder' } }),
    prisma.user.create({ data: { email: 'dev3@agency.com', passwordHash: await hash('password123'), role: Role.DEV, name: 'Zara Builds' } }),
    prisma.user.create({ data: { email: 'dev4@agency.com', passwordHash: await hash('password123'), role: Role.DEV, name: 'Jake Tech' } }),
  ]);
  console.log('✅ Users created');

  // --- Clients ---
  const [clientA, clientB, clientC] = await Promise.all([
    prisma.client.create({ data: { name: 'Acme Corp' } }),
    prisma.client.create({ data: { name: 'BrightEdge Ltd' } }),
    prisma.client.create({ data: { name: 'Cosmo Startup' } }),
  ]);
  console.log('✅ Clients created');

  // --- Projects ---
  const now = new Date();
  const past = (days: number) => new Date(now.getTime() - days * 86400000);
  const future = (days: number) => new Date(now.getTime() + days * 86400000);

  const [proj1, proj2, proj3] = await Promise.all([
    prisma.project.create({ data: { name: 'Acme Website Redesign', clientId: clientA.id, pmId: pm1.id } }),
    prisma.project.create({ data: { name: 'BrightEdge Mobile App', clientId: clientB.id, pmId: pm1.id } }),
    prisma.project.create({ data: { name: 'Cosmo Brand Launch', clientId: clientC.id, pmId: pm2.id } }),
  ]);
  console.log('✅ Projects created');

  // --- Tasks: Project 1 ---
  const tasks1 = await prisma.task.createManyAndReturn({
    data: [
      { title: 'Design homepage mockups', description: 'Create Figma wireframes for the hero section', priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: past(10), projectId: proj1.id, developerId: dev1.id },
      { title: 'Implement responsive navbar', description: 'Build mobile-first navigation with dropdowns', priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: future(3), projectId: proj1.id, developerId: dev1.id },
      { title: 'Build contact form', description: 'Email validation + captcha + API endpoint', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_REVIEW, dueDate: future(5), projectId: proj1.id, developerId: dev2.id },
      { title: 'Set up CI/CD pipeline', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: future(14), projectId: proj1.id, developerId: dev3.id },
      { title: 'Fix broken image gallery', description: 'Gallery crashes on Safari 16', priority: TaskPriority.CRITICAL, status: TaskStatus.OVERDUE, dueDate: past(5), projectId: proj1.id, developerId: dev2.id },
      { title: 'SEO meta tag audit', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: future(20), projectId: proj1.id },
    ],
  });

  // --- Tasks: Project 2 ---
  const tasks2 = await prisma.task.createManyAndReturn({
    data: [
      { title: 'Set up React Native project', priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: past(15), projectId: proj2.id, developerId: dev3.id },
      { title: 'Implement auth flow (OTP)', description: 'Phone number OTP login', priority: TaskPriority.CRITICAL, status: TaskStatus.IN_PROGRESS, dueDate: future(2), projectId: proj2.id, developerId: dev3.id },
      { title: 'Push notification integration', priority: TaskPriority.HIGH, status: TaskStatus.TODO, dueDate: future(7), projectId: proj2.id, developerId: dev4.id },
      { title: 'User profile screen', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_REVIEW, dueDate: future(4), projectId: proj2.id, developerId: dev4.id },
      { title: 'API rate limiting', description: 'Prevent brute force on login', priority: TaskPriority.HIGH, status: TaskStatus.OVERDUE, dueDate: past(3), projectId: proj2.id, developerId: dev1.id },
      { title: 'App store screenshots', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: future(30), projectId: proj2.id },
    ],
  });

  // --- Tasks: Project 3 ---
  const tasks3 = await prisma.task.createManyAndReturn({
    data: [
      { title: 'Brand identity guidelines', priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: past(20), projectId: proj3.id, developerId: dev2.id },
      { title: 'Social media banner pack', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: future(6), projectId: proj3.id, developerId: dev2.id },
      { title: 'Press kit landing page', priority: TaskPriority.HIGH, status: TaskStatus.TODO, dueDate: future(8), projectId: proj3.id, developerId: dev1.id },
      { title: 'Video intro animation', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_REVIEW, dueDate: future(10), projectId: proj3.id, developerId: dev4.id },
      { title: 'Email newsletter template', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: future(15), projectId: proj3.id, developerId: dev3.id },
      { title: 'Launch event microsite', priority: TaskPriority.CRITICAL, status: TaskStatus.TODO, dueDate: future(12), projectId: proj3.id },
    ],
  });

  console.log('✅ Tasks created');

  // --- Activity Logs ---
  const createLog = (userId: string, projectId: string, action: string, taskId?: string, prev?: string, next?: string) =>
    prisma.activityLog.create({
      data: { userId, projectId, action, taskId: taskId || null, previousValue: prev || null, newValue: next || null },
    });

  await Promise.all([
    // Project 1
    createLog(pm1.id, proj1.id, 'CREATED_PROJECT', undefined, undefined, 'Acme Website Redesign'),
    createLog(pm1.id, proj1.id, 'CREATED_TASK', tasks1[0].id, undefined, 'Design homepage mockups'),
    createLog(dev1.id, proj1.id, 'STATUS_CHANGED', tasks1[0].id, 'IN_PROGRESS', 'DONE'),
    createLog(dev2.id, proj1.id, 'STATUS_CHANGED', tasks1[2].id, 'IN_PROGRESS', 'IN_REVIEW'),
    createLog(pm1.id, proj1.id, 'REASSIGNED', tasks1[3].id, undefined, dev3.id),
    // Project 2
    createLog(pm1.id, proj2.id, 'CREATED_PROJECT', undefined, undefined, 'BrightEdge Mobile App'),
    createLog(dev3.id, proj2.id, 'STATUS_CHANGED', tasks2[0].id, 'IN_PROGRESS', 'DONE'),
    createLog(dev4.id, proj2.id, 'STATUS_CHANGED', tasks2[3].id, 'TODO', 'IN_REVIEW'),
    // Project 3
    createLog(pm2.id, proj3.id, 'CREATED_PROJECT', undefined, undefined, 'Cosmo Brand Launch'),
    createLog(dev2.id, proj3.id, 'STATUS_CHANGED', tasks3[0].id, 'IN_PROGRESS', 'DONE'),
  ]);
  console.log('✅ Activity logs created');

  // --- Notifications ---
  await Promise.all([
    prisma.notification.create({ data: { userId: dev1.id, message: 'You have been assigned to task: "Implement responsive navbar"', isRead: false } }),
    prisma.notification.create({ data: { userId: dev2.id, message: 'You have been assigned to task: "Build contact form"', isRead: false } }),
    prisma.notification.create({ data: { userId: dev3.id, message: 'You have been assigned to task: "Implement auth flow (OTP)"', isRead: false } }),
    prisma.notification.create({ data: { userId: pm1.id, message: 'Task "Build contact form" is ready for review.', isRead: false } }),
    prisma.notification.create({ data: { userId: pm1.id, message: 'Task "User profile screen" is ready for review.', isRead: true } }),
    prisma.notification.create({ data: { userId: dev4.id, message: 'You have been assigned to task: "User profile screen"', isRead: true } }),
  ]);
  console.log('✅ Notifications created');

  console.log('\n🎉 Seed complete!');
  console.log('\nLogin credentials (password: password123):');
  console.log('  Admin:  admin@agency.com');
  console.log('  PM 1:   pm1@agency.com');
  console.log('  PM 2:   pm2@agency.com');
  console.log('  Dev 1:  dev1@agency.com');
  console.log('  Dev 2:  dev2@agency.com');
  console.log('  Dev 3:  dev3@agency.com');
  console.log('  Dev 4:  dev4@agency.com');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
