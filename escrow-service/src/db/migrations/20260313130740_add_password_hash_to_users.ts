import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'password_hash');
  if (hasColumn) return;
  return knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).notNullable().after('email');
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'password_hash');
  if (!hasColumn) return;
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('password_hash');
  });
}

