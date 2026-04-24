import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'razorpay_account_id');
  if (hasColumn) return;
  return knex.schema.alterTable('users', (table) => {
    table.string('razorpay_account_id', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'razorpay_account_id');
  if (!hasColumn) return;
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('razorpay_account_id');
  });
}

