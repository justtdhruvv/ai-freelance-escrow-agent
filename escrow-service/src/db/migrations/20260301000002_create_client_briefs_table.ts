import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('client_briefs', (table) => {
    table.string('brief_id', 36).primary();
    table.string('project_id', 36).notNullable();
    table.text('raw_text').notNullable();
    table.enum('domain', ['code', 'design', 'content', 'general']).notNullable();
    table.boolean('ai_processed').defaultTo(false);
    table.json('ai_generated_requirements').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('project_id').references('project_id').inTable('projects').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_briefs');
}
