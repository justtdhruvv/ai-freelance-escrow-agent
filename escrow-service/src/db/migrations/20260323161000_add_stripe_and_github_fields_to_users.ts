import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('stripe_account_id', 255).nullable();
    table.text('github_token').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('stripe_account_id');
    table.dropColumn('github_token');
  });
}
