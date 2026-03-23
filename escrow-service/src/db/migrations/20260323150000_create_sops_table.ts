import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sops', (table) => {
    table.string('sop_id', 36).primary();
    table.string('project_id', 36).notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.text('content_html').notNullable();
    table.boolean('freelancer_approved').defaultTo(false);
    table.boolean('client_approved').defaultTo(false);
    table.timestamp('locked_at').nullable();
    table.json('edit_history').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('project_id').references('project_id').inTable('projects').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sops');
}
