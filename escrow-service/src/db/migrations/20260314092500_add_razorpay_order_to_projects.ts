import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('projects', 'razorpay_order_id');
  if (hasColumn) return;
  return knex.schema.alterTable('projects', (table) => {
    table.string('razorpay_order_id', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('projects', 'razorpay_order_id');
  if (!hasColumn) return;
  return knex.schema.alterTable('projects', (table) => {
    table.dropColumn('razorpay_order_id');
  });
}
