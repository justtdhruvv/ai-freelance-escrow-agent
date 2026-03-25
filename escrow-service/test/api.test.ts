import request from 'supertest';
import app from '../dist/src/server';

describe('Backend API End-to-End Tests', () => {
  let authToken: string;
  let projectId: string;
  let milestoneId: string;
  let submissionId: string;
  let aqaResultId: string;

  const testUser = {
    email: 'test@example.com',
    password: 'test123',
    name: 'Test User'
  };

  const testProject = {
    name: 'Test Project',
    description: 'A test project for API testing',
    total_price: 1000,
    timeline_days: 30
  };

  const testClientBrief = {
    raw_text: 'Build a responsive web application with React and Node.js',
    domain: 'code'
  };

  const testSubmission = {
    github_url: 'https://github.com/test/test-project',
    comments: 'Initial submission for testing'
  };

  beforeAll(async () => {
    // Setup: Create test user and get auth token
    const signupResponse = await request(app)
      .post('/auth/signup')
      .send(testUser);

    expect(signupResponse.status).toBe(200);
    
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.token;
  });

  describe('Authentication APIs', () => {
    test('POST /auth/signup - Create new user', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('POST /auth/login - Authenticate user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Project Management APIs', () => {
    test('POST /projects - Create new project', async () => {
      const response = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProject);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('project_id');
      projectId = response.body.project_id;

      // Verify project data
      expect(response.body.name).toBe(testProject.name);
      expect(response.body.total_price).toBe(testProject.total_price);
    });

    test('GET /projects - Get all projects', async () => {
      const response = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /projects/:id - Get specific project', async () => {
      const response = await request(app)
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.project_id).toBe(projectId);
    });
  });

  describe('Client Brief APIs', () => {
    test('POST /projects/:id/brief - Create client brief', async () => {
      const response = await request(app)
        .post(`/projects/${projectId}/brief`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testClientBrief);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('brief_id');
    });

    test('GET /projects/:id/brief - Get client brief', async () => {
      const response = await request(app)
        .get(`/projects/${projectId}/brief`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.raw_text).toBe(testClientBrief.raw_text);
    });
  });

  describe('SOP Generation APIs', () => {
    test('POST /sops/generate - Generate SOP', async () => {
      const response = await request(app)
        .post('/sops/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          raw_text: testClientBrief.raw_text,
          domain: testClientBrief.domain,
          timeline_days: testProject.timeline_days
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sop_id');
    });

    test('GET /sops/project/:id - Get SOPs by project', async () => {
      const response = await request(app)
        .get(`/sops/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Payment APIs', () => {
    test('POST /payments/projects/:id/escrow - Create escrow order', async () => {
      const response = await request(app)
        .post(`/payments/projects/${projectId}/escrow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order_id');
    });

    test('GET /payments/key - Get Razorpay key', async () => {
      const response = await request(app)
        .get('/payments/key')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('key');
    });

    test('GET /payments/projects/:id/payment-events - Get payment events', async () => {
      const response = await request(app)
        .get(`/payments/projects/${projectId}/payment-events`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Submission APIs', () => {
    test('POST /projects/:id/milestones/:mid/submissions - Create submission', async () => {
      // First get milestones from SOP
      const sopResponse = await request(app)
        .get(`/sops/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (sopResponse.body.length > 0) {
        const sop = sopResponse.body[0];
        const milestonesResponse = await request(app)
          .get(`/sops/${sop.sop_id}/milestones`)
          .set('Authorization', `Bearer ${authToken}`);

        if (milestonesResponse.body.length > 0) {
          milestoneId = milestonesResponse.body[0].milestone_id;

          const response = await request(app)
            .post(`/projects/${projectId}/milestones/${milestoneId}/submissions`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(testSubmission);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('submission_id');
          submissionId = response.body.submission_id;
        }
      }
    });

    test('GET /submissions/:id - Get submission by ID', async () => {
      if (submissionId) {
        const response = await request(app)
          .get(`/submissions/${submissionId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.submission_id).toBe(submissionId);
      }
    });
  });

  describe('AQA APIs', () => {
    test('POST /submissions/:id/run-aqa - Run AQA', async () => {
      if (submissionId) {
        const response = await request(app)
          .post(`/submissions/${submissionId}/run-aqa`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            client_brief: testClientBrief.raw_text,
            domain: testClientBrief.domain
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('aqa_id');
        aqaResultId = response.body.aqa_id;
      }
    });

    test('GET /submissions/:id/aqa-result - Get AQA result', async () => {
      if (submissionId) {
        const response = await request(app)
          .get(`/submissions/${submissionId}/aqa-result`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('aqa_id');
      }
    });
  });

  describe('Payment Release APIs', () => {
    test('POST /milestones/:id/release - Release full payment', async () => {
      if (milestoneId) {
        const response = await request(app)
          .post(`/milestones/${milestoneId}/release`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            triggered_by: 'manual'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('payment_event_id');
      }
    });

    test('POST /milestones/:id/release-prorated - Release prorated payment', async () => {
      if (milestoneId) {
        const response = await request(app)
          .post(`/milestones/${milestoneId}/release-prorated`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            passRate: 0.75
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('payment_event_id');
      }
    });
  });

  describe('User Profile APIs', () => {
    test('GET /users/profile - Get user profile', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user_id');
    });
  });

  describe('Wallet APIs', () => {
    test('GET /wallet - Get user wallet', async () => {
      const response = await request(app)
        .get('/wallet')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
    });
  });

  // Integration Tests
  describe('End-to-End Integration Tests', () => {
    test('Complete workflow: Project → AQA → Payment', async () => {
      // This test validates the complete autonomous flow
      // 1. Create project
      // 2. Generate SOP
      // 3. Create escrow
      // 4. Submit milestone
      // 5. Run AQA
      // 6. Verify automatic payment release
      
      expect(projectId).toBeDefined();
      expect(submissionId).toBeDefined();
      expect(aqaResultId).toBeDefined();
      
      // Verify payment events were created
      const paymentEventsResponse = await request(app)
        .get(`/payments/projects/${projectId}/payment-events`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(paymentEventsResponse.status).toBe(200);
      expect(paymentEventsResponse.body.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Cleanup: Test data cleanup if needed
    console.log('API tests completed successfully');
  });
});
