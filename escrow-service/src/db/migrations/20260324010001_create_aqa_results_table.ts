import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('aqa_results', (table) => {
    table.string('aqa_id', 36).primary();
    table.string('submission_id', 36).notNullable();
    table.string('milestone_id', 36).notNullable();
    table.enum('verdict', ['passed', 'partial', 'failed', 'error']).notNullable();
    table.decimal('pass_rate', 5, 4).notNullable();
    table.enum('payment_trigger', ['full', 'prorated', 'none', 'error']).notNullable();
    table.enum('payment_status', ['pending', 'processed']).defaultTo('pending');
    table.json('audit_report').nullable();
    table.json('all_checks').nullable();
    table.integer('milestone_amount').notNullable();
    table.integer('execution_time_ms').nullable();
    table.string('ai_model_used', 100).nullable();
    table.text('error_message').nullable();
    table.string('aqa_version', 10).defaultTo('v1');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Unique constraint for one result per submission
    table.unique(['submission_id'], 'uniq_aqa_submission');
    
    // Indexes
    table.index(['milestone_id'], 'idx_aqa_milestone');
    
    // Foreign key constraints
    table.foreign('submission_id').references('submission_id').inTable('submissions').onDelete('CASCADE');
    table.foreign('milestone_id').references('milestone_id').inTable('milestone_checks').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('aqa_results');
}
