#!/bin/sh
set -e

# Ensure persistent data directory exists
mkdir -p /app/data

echo "Running database migrations..."
node -e "
const knex = require('knex');
const config = require('./dist/knexfile').default;
const db = knex(config[process.env.NODE_ENV || 'production']);
db.migrate.latest().then(() => {
  console.log('Migrations complete');
  process.exit(0);
}).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
"

echo "Starting server..."
exec node dist/src/server.js
