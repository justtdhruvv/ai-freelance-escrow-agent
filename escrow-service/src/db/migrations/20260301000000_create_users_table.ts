import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('user_id', 36).primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['employer', 'freelancer']).notNullable();
    table.integer('pfi_score').defaultTo(500);
    table.integer('trust_score').defaultTo(500);
    table.json('pfi_history').nullable();
    table.boolean('grace_period_active').defaultTo(false);
    table.string('razorpay_account_id', 255).nullable();
    table.string('stripe_account_id', 255).nullable();
    table.text('github_token').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
