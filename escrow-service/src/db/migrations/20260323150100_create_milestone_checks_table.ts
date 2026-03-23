import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('milestone_checks', (table) => {
    table.string('milestone_id', 36).primary();
    table.string('sop_id', 36).notNullable();
    table.string('project_id', 36).notNullable();
    table.string('title').notNullable();
    table.date('deadline').notNullable();
    table.integer('payment_amount').notNullable();
    table.enum('status', ['pending', 'in_progress', 'passed', 'failed', 'paid']).defaultTo('pending');
    table.integer('revisions_used').defaultTo(0);
    table.integer('max_revisions').defaultTo(2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('sop_id').references('sop_id').inTable('sops').onDelete('CASCADE');
    table.foreign('project_id').references('project_id').inTable('projects').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('milestone_checks');
}
