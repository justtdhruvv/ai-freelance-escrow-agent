import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('submissions', (table) => {
    table.string('submission_id', 36).primary();
    table.string('project_id', 36).notNullable();
    table.string('milestone_id', 36).notNullable();
    table.string('user_id', 36).notNullable();
    table.enum('type', ['code', 'content', 'design', 'mixed']).notNullable();
    table.text('content').nullable();
    table.string('repo_url', 500).nullable();
    table.string('repo_branch', 100).defaultTo('main');
    table.enum('status', ['draft', 'submitted', 'aqa_running', 'aqa_completed', 'aqa_failed']).defaultTo('draft');
    table.integer('retry_count').defaultTo(0);
    table.timestamp('submitted_at').nullable();
    table.timestamp('aqa_started_at').nullable();
    table.timestamp('aqa_completed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['project_id', 'milestone_id'], 'idx_submission_project_milestone');
    table.index(['user_id'], 'idx_submission_user');
    table.index(['status'], 'idx_submission_status');
    
    // Foreign key constraints
    table.foreign('project_id').references('project_id').inTable('projects').onDelete('CASCADE');
    table.foreign('milestone_id').references('milestone_id').inTable('milestone_checks').onDelete('CASCADE');
    table.foreign('user_id').references('user_id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('submissions');
}
