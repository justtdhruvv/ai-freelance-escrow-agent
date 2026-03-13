import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('freelancer_clients', (table) => {
    table.string('id', 36).primary();
    table.string('freelancer_id', 36).notNullable();
    table.string('client_id', 36).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('freelancer_id').references('user_id').inTable('users').onDelete('CASCADE');
    table.foreign('client_id').references('user_id').inTable('users').onDelete('CASCADE');
    
    // Ensure unique freelancer-client pairs
    table.unique(['freelancer_id', 'client_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('freelancer_clients');
}

