import express from 'express';
import request from 'supertest';
import { createResourceLimiter } from './rateLimit';

describe('Rate Limiting Middleware', () => {
  let app: express.Application;

  // Before each test, set up a new Express app with the rate limiter
  beforeEach(() => {
    app = express();

    // This mock middleware adds a `req.user` object if a specific header is present,
    // allowing us to test the authenticated user scenario.
    app.use((req, res, next) => {
      if (req.headers['x-user-id']) {
        // @ts-ignore - Augmenting request for test purposes
        req.user = { id: req.headers['x-user-id'] as string };
      }
      next();
    });

    // Apply the rate limiter to all routes in this test app
    app.use(createResourceLimiter);

    // A simple test route
    app.get('/', (req, res) => res.status(200).send('OK'));
  });

  // To run tests faster, we can use Jest's fake timers
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should allow requests under the limit for an unauthenticated user (by IP)', async () => {
    // Make 20 requests, all should be successful
    for (let i = 0; i < 20; i++) {
      await request(app).get('/').expect(200);
    }
  });

  it('should block requests over the limit for an unauthenticated user (by IP)', async () => {
    const agent = request(app);

    // Make 20 successful requests
    for (let i = 0; i < 20; i++) {
      await agent.get('/').expect(200);
    }

    // The 21st request should be blocked
    const response = await agent.get('/');
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('should allow requests under the limit for an authenticated user (by user ID)', async () => {
    // Make 20 requests for a specific user, all should be successful
    for (let i = 0; i < 20; i++) {
      await request(app).get('/').set('x-user-id', 'user-123').expect(200);
    }
  });

  it('should block requests over the limit for an authenticated user (by user ID)', async () => {
    const agent = request(app);

    // Make 20 successful requests for a specific user
    for (let i = 0; i < 20; i++) {
      await agent.get('/').set('x-user-id', 'user-123').expect(200);
    }

    // The 21st request for the same user should be blocked
    const response = await agent.get('/').set('x-user-id', 'user-123');
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('should reset the limit after the windowMs has passed', async () => {
    const agent = request(app);

    // Exhaust the rate limit
    for (let i = 0; i < 20; i++) {
      await agent.get('/').expect(200);
    }
    await agent.get('/').expect(429);

    // Advance time by 1 minute (the windowMs for the limiter)
    jest.advanceTimersByTime(1 * 60 * 1000);

    // The next request should now be successful again
    await agent.get('/').expect(200);
  });
});
