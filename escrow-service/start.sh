#!/bin/sh
set -e

mkdir -p /app/data

echo "Running database migrations..."
node -e "
const knex = require('knex');
const path = require('path');
const db = knex({
  client: 'better-sqlite3',
  connection: { filename: process.env.DB_PATH || '/app/data/db.sqlite' },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(process.cwd(), 'dist/src/db/migrations'),
    loadExtensions: ['.js'],
    tableName: 'knex_migrations'
  }
});
db.migrate.latest().then(() => {
  console.log('Migrations complete');
  process.exit(0);
}).catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
"

echo "Starting server..."
exec node dist/src/server.js
