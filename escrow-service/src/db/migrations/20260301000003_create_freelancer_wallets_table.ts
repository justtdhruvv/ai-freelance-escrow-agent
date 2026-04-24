import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('freelancer_wallets', (table) => {
    table.string('wallet_id', 36).primary();
    table.string('freelancer_id', 36).notNullable().unique();
    table.integer('balance').defaultTo(0);
    table.integer('available_balance').defaultTo(0);
    table.integer('pending_balance').defaultTo(0);
    table.enum('wallet_type', ['internal', 'real']).defaultTo('internal');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('freelancer_id').references('user_id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('freelancer_wallets');
}
