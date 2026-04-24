import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasStripe = await knex.schema.hasColumn('users', 'stripe_account_id');
  const hasGithub = await knex.schema.hasColumn('users', 'github_token');
  if (hasStripe && hasGithub) return;
  return knex.schema.alterTable('users', (table) => {
    if (!hasStripe) table.string('stripe_account_id', 255).nullable();
    if (!hasGithub) table.text('github_token').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasStripe = await knex.schema.hasColumn('users', 'stripe_account_id');
  const hasGithub = await knex.schema.hasColumn('users', 'github_token');
  if (!hasStripe && !hasGithub) return;
  return knex.schema.alterTable('users', (table) => {
    if (hasStripe) table.dropColumn('stripe_account_id');
    if (hasGithub) table.dropColumn('github_token');
  });
}
