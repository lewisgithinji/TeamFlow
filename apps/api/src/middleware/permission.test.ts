import { getMockReq, getMockRes } from '@jest-mock/express';
import { prisma } from '@teamflow/database';
import { isWorkspaceMember, hasRole, isTaskCreatorOrHasRole } from './permission';
import { ForbiddenError, NotFoundError, AppError } from '../utils/errors';

// Mock the prisma client
jest.mock('@teamflow/database', () => ({
  prisma: {
    task: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
  },
}));

const { res, next, mockClear } = getMockRes();

describe('Authorization Middleware', () => {
  beforeEach(() => {
    mockClear(); // Clears mock calls and instances between tests
    (prisma.task.findUnique as jest.Mock).mockClear();
    (prisma.project.findUnique as jest.Mock).mockClear();
    (prisma.workspaceMember.findUnique as jest.Mock).mockClear();
  });

  describe('isWorkspaceMember', () => {
    it('should call next() and attach membership if user is a member (via taskId)', async () => {
      const req = getMockReq({
        user: { id: 'user-1' },
        params: { taskId: 'task-1' },
      });

      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        project: { workspaceId: 'workspace-1' },
      });
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'MEMBER',
      });

      await isWorkspaceMember(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.membership).toBeDefined();
      expect(req.membership.role).toBe('MEMBER');
    });

    it('should call next() and attach membership if user is a member (via projectId)', async () => {
      const req = getMockReq({
        user: { id: 'user-1' },
        params: { projectId: 'project-1' },
      });

      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        workspaceId: 'workspace-1',
      });
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'ADMIN',
      });

      await isWorkspaceMember(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.membership).toBeDefined();
      expect(req.membership.role).toBe('ADMIN');
    });

    it('should call next(ForbiddenError) if user is not a member', async () => {
      const req = getMockReq({
        user: { id: 'user-2' },
        params: { taskId: 'task-1' },
      });

      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        project: { workspaceId: 'workspace-1' },
      });
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(null);

      await isWorkspaceMember(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should call next() if task is not found, letting controller handle 404', async () => {
      const req = getMockReq({
        user: { id: 'user-1' },
        params: { taskId: 'task-not-found' },
      });

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await isWorkspaceMember(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
    });

    it('should call next(AppError) if user is not authenticated', async () => {
      const req = getMockReq({ params: { taskId: 'task-1' } }); // No user object

      await isWorkspaceMember(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(401);
    });
  });

  describe('hasRole', () => {
    it('should call next() if user has an allowed role', () => {
      const req = getMockReq({
        membership: { role: 'ADMIN' },
      });
      const middleware = hasRole(['OWNER', 'ADMIN']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next(ForbiddenError) if user does not have an allowed role', () => {
      const req = getMockReq({
        membership: { role: 'MEMBER' },
      });
      const middleware = hasRole(['OWNER', 'ADMIN']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should call next(NotFoundError) if req.membership is missing', () => {
      const req = getMockReq({}); // No membership object
      const middleware = hasRole(['OWNER', 'ADMIN']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('isTaskCreatorOrHasRole', () => {
    it('should call next() if user has an allowed role', async () => {
      const req = getMockReq({
        user: { id: 'user-admin' },
        params: { taskId: 'task-1' },
        membership: { role: 'ADMIN' },
      });
      const middleware = isTaskCreatorOrHasRole(['OWNER', 'ADMIN']);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      // Should not even check the database for the creator
      expect(prisma.task.findUnique).not.toHaveBeenCalled();
    });

    it('should call next() if user is the task creator', async () => {
      const req = getMockReq({
        user: { id: 'user-creator' },
        params: { taskId: 'task-1' },
        membership: { role: 'MEMBER' }, // A non-privileged role
      });

      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        createdBy: 'user-creator',
      });

      const middleware = isTaskCreatorOrHasRole(['OWNER', 'ADMIN']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        select: { createdBy: true },
      });
    });

    it('should call next(ForbiddenError) if user is neither creator nor has role', async () => {
      const req = getMockReq({
        user: { id: 'user-other' },
        params: { taskId: 'task-1' },
        membership: { role: 'MEMBER' },
      });

      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        createdBy: 'user-creator', // A different user
      });

      const middleware = isTaskCreatorOrHasRole(['OWNER', 'ADMIN']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should call next(ForbiddenError) if task is not found', async () => {
      const req = getMockReq({
        user: { id: 'user-member' },
        params: { taskId: 'task-not-found' },
        membership: { role: 'MEMBER' },
      });

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      const middleware = isTaskCreatorOrHasRole(['OWNER', 'ADMIN']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should call next(AppError) if taskId is missing', async () => {
      const req = getMockReq({
        user: { id: 'user-1' },
        params: {}, // No taskId
        membership: { role: 'ADMIN' },
      });

      const middleware = isTaskCreatorOrHasRole(['OWNER', 'ADMIN']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(400);
    });
  });
});
