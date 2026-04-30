import knex from 'knex';
import knexConfig from '../knexfile';

let db: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  db = knex((knexConfig as any)['test']);
  await db.migrate.latest();
}, 30000);

afterAll(async () => {
  if (db) {
    await db.migrate.rollback(undefined, true);
    await db.destroy();
  }
}, 30000);
