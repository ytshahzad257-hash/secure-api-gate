import { createSeedData } from "../src/data/seed-data.js";

export async function seedDemoData(): Promise<void> {
  const data = createSeedData();

  console.log(
    JSON.stringify(
      {
        users: data.users.length,
        profiles: data.profiles.length,
        orders: data.orders.length,
        payments: data.payments.length,
        tickets: data.tickets.length,
        approvals: data.approvals.length,
        inventory: data.inventory.length
      },
      null,
      2
    )
  );
}

void seedDemoData();
