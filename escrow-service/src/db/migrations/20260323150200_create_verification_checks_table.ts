import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('verification_checks', (table) => {
    table.string('check_id', 36).primary();
    table.string('sop_id', 36).notNullable();
    table.string('milestone_id', 36).notNullable();
    table.string('type').notNullable();
    table.text('description').notNullable();
    table.json('params').notNullable();
    table.enum('result', ['pending', 'pass', 'partial', 'fail']).defaultTo('pending');
    table.text('evidence').nullable();
    table.string('verified_by').notNullable();
    table.timestamp('verified_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('sop_id').references('sop_id').inTable('sops').onDelete('CASCADE');
    table.foreign('milestone_id').references('milestone_id').inTable('milestone_checks').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('verification_checks');
}
