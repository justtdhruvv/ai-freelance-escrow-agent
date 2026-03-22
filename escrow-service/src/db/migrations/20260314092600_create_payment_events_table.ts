import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('payment_events', (table) => {
    table.string('payment_event_id', 36).primary();
    table.string('project_id', 36).notNullable();
    table.string('milestone_id', 36).nullable();
    
    table.enum('type', ['escrow_hold', 'milestone_release', 'prorated_release', 'refund']).notNullable();
    table.integer('amount').notNullable();
    
    table.string('razorpay_order_id', 255).nullable();
    table.string('razorpay_payment_id', 255).nullable();
    table.string('razorpay_transfer_id', 255).nullable();
    
    table.enum('triggered_by', ['aqa_auto', 'manual', 'dispute_resolution']).defaultTo('manual');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('project_id').references('project_id').inTable('projects').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('payment_events');
}
