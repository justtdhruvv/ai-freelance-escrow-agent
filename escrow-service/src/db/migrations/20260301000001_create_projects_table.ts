import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (table) => {
    table.string('project_id', 36).primary();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('employer_id', 36).notNullable();
    table.string('freelancer_id', 36).nullable();
    table.enum('status', ['draft', 'sop_review', 'client_review', 'active', 'completed', 'disputed', 'cancelled']).notNullable().defaultTo('draft');
    table.integer('total_price').notNullable();
    table.integer('timeline_days').nullable();
    table.string('razorpay_order_id', 255).nullable();
    table.integer('escrow_balance').defaultTo(0);
    table.string('stripe_payment_intent_id', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('employer_id').references('user_id').inTable('users').onDelete('CASCADE');
    table.foreign('freelancer_id').references('user_id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('projects');
}
