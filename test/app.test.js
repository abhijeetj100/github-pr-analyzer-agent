const { createApp } = require('../src/app');
const request = require('supertest');

let app;
let db;

beforeAll(async () => {
  app = await createApp({ config: { databasePath: ':memory:' } });
  db = app.locals.db;
});

afterAll(async () => {
  if (db) {
    await db.close();
  }
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});

describe('GET /stats', () => {
  it('returns empty stats on fresh database', async () => {
    const response = await request(app).get('/stats');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.completed).toBe(0);
    expect(response.body.failed).toBe(0);
    expect(response.body.in_progress).toBe(0);
  });
});
