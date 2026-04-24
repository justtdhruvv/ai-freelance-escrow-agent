import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallet_transactions', (table) => {
    table.string('transaction_id', 36).primary();
    table.string('wallet_id', 36).notNullable();
    table.enum('type', ['credit', 'debit', 'conversion']).notNullable();
    table.integer('amount').notNullable();
    table.text('description').nullable();
    table.string('reference_id', 36).nullable();
    table.enum('reference_type', ['payment_event', 'conversion', 'manual_adjustment']).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('wallet_id').references('wallet_id').inTable('freelancer_wallets').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallet_transactions');
}
