export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MentorConnect API (Capstone BCA-05)',
    version: '1.0.0',
    description:
      'Explainable Alumni-Mentor Matching Marketplace with Capacity-Aware Recommendations.\n\nKey features:\n- 100% explainable weighted factor matching (Skills 45%, Interests 20%, Goals 15%, Languages 10%, Availability 5%, Capacity 5%).\n- Atomic capacity reservation with $expr guard.\n- Bidirectional conflict-free meeting scheduling.\n- Tamper-evident SHA-256 chained audit ledger.\n- AI Advisory Service with deterministic fallback.',
    contact: {
      name: 'BCA-05 Capstone Engineering Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      MatchFactor: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'skills' },
          rawScore: { type: 'number', example: 80 },
          weight: { type: 'number', example: 0.45 },
          contribution: { type: 'number', example: 36 },
          matchedItems: { type: 'array', items: { type: 'string' }, example: ['React', 'Node.js'] },
          explanation: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['student', 'mentor', 'admin'] },
          skills: { type: 'array', items: { type: 'string' } },
          interests: { type: 'array', items: { type: 'string' } },
          capacity: { type: 'number' },
          currentMentees: { type: 'number' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          200: { description: 'Service is healthy and connected to database' },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Operational metrics (latency p50/p95, error rate, AI telemetry)',
        responses: {
          200: { description: 'Operational telemetry and runtime metrics' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful with JWT token and profile' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/matches/{studentId}': {
      get: {
        summary: 'Get ranked mentors with factor breakdowns for a student',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'studentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Ranked list of mentors with explainable scores and factors' },
        },
      },
    },
    '/mentorship-requests': {
      get: {
        summary: 'List mentorship requests for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of requests' },
        },
      },
      post: {
        summary: 'Submit a new mentorship request (Snapshot computed server-side)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mentorId'],
                properties: {
                  mentorId: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Request created with server-computed snapshot' },
          409: { description: 'Existing active or pending request exists' },
        },
      },
    },
    '/mentorship-requests/{id}/respond': {
      patch: {
        summary: 'Mentor responds to a request (Atomic capacity guard enforced)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['accepted', 'rejected'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Request responded and capacity atomically updated' },
          400: { description: 'Mentor capacity is full or request already answered' },
        },
      },
    },
    '/meetings': {
      get: {
        summary: 'List scheduled meetings for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of meetings' },
        },
      },
      post: {
        summary: 'Schedule a new meeting (Validates mentor slot and bidirectional conflicts)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mentorId', 'studentId', 'date', 'time'],
                properties: {
                  mentorId: { type: 'string' },
                  studentId: { type: 'string' },
                  date: { type: 'string', example: '2026-10-15' },
                  time: { type: 'string', example: '18:00' },
                  mode: { type: 'string', example: 'Online' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Meeting booked successfully' },
          400: { description: 'Slot not in mentor availability' },
          409: { description: 'Scheduling conflict detected' },
        },
      },
    },
    '/ai/explain-match': {
      post: {
        summary: 'Explain a student\'s match using server-computed factors',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mentorId'],
                properties: {
                  mentorId: { type: 'string', description: 'Mentor ObjectId. Scores and factors are computed server-side.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Natural language explanation of score' },
        },
      },
    },
    '/ai/suggest-goals': {
      post: {
        summary: 'Generate 3-5 SMART goals from profile skills and mentor expertise',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of suggested SMART goals' },
        },
      },
    },
    '/admin/analytics': {
      get: {
        summary: 'Server-side aggregated platform analytics (Gini load balance, funnel, capacity)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Calculated platform metrics' },
        },
      },
    },
    '/audit-logs/verify': {
      get: {
        summary: 'Verify SHA-256 cryptographic hash chain integrity of audit logs',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Chain verification result' },
        },
      },
    },
  },
};
