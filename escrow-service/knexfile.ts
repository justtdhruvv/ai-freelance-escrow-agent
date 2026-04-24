import type { Knex } from 'knex';
import path from 'path';

const migrationsDir = './src/db/migrations';
const seedsDir = './src/db/seeds';

// In production, the DB lives on a persistent volume mounted at /app/data
const productionDbPath = process.env.DB_PATH || '/app/data/db.sqlite';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './dev.sqlite3',
    },
    useNullAsDefault: true,
    migrations: {
      directory: migrationsDir,
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: seedsDir,
    },
  },

  production: {
    client: 'better-sqlite3',
    connection: {
      filename: productionDbPath,
    },
    useNullAsDefault: true,
    migrations: {
      directory: migrationsDir,
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: seedsDir,
    },
  },
};

export default config;
