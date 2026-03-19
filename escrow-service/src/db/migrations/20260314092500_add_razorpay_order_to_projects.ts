import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('projects', (table) => {
    table.string('razorpay_order_id', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('projects', (table) => {
    table.dropColumn('razorpay_order_id');
  });
}
