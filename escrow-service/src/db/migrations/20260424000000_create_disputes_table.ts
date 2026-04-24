import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('disputes', (table) => {
    table.string('dispute_id').primary();
    table.string('project_id').notNullable();
    table.string('raised_by').notNullable();
    table.string('dispute_type').notNullable(); // quality | deadline | communication | scope | payment | aqa_conflict | other
    table.text('description').notNullable();
    table.string('status').notNullable().defaultTo('open'); // open | under_review | resolved | closed
    table.text('resolution').nullable();
    table.string('resolved_by').nullable();
    table.string('milestone_id').nullable(); // if dispute is about a specific milestone AQA result
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('resolved_at').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('disputes');
}
