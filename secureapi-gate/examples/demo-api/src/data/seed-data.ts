export interface DemoUser {
  id: string;
  email: string;
  role: "user" | "manager" | "admin";
  tenantId: string;
  isAdmin: boolean;
  accountStatus: "active" | "suspended";
  displayName: string;
}

export interface DemoProfile {
  id: string;
  userId: string;
  ownerId: string;
  tenantId: string;
  displayName: string;
  bio: string;
  role?: string;
  isAdmin?: boolean;
}

export interface DemoOrder {
  id: string;
  userId: string;
  tenantId: string;
  total: number;
  status: "open" | "shipped";
}

export interface DemoPayment {
  id: string;
  userId: string;
  customerId: string;
  tenantId: string;
  amount: number;
  paymentStatus: "pending" | "paid" | "failed";
  approvalId: string;
}

export interface DemoTicket {
  id: string;
  userId: string;
  ownerId: string;
  tenantId: string;
  subject: string;
  status: "open" | "closed";
}

export interface DemoApprovalRequest {
  id: string;
  userId: string;
  ownerId: string;
  tenantId: string;
  approvalState: "draft" | "submitted" | "approved" | "rejected" | "paid";
  amount: number;
}

export interface DemoInventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface DemoStore {
  users: DemoUser[];
  profiles: DemoProfile[];
  orders: DemoOrder[];
  payments: DemoPayment[];
  tickets: DemoTicket[];
  approvals: DemoApprovalRequest[];
  inventory: DemoInventoryItem[];
  webhookDeliveries: Set<string>;
}

export function createSeedData(): DemoStore {
  return {
    users: [
      {
        id: "user-1",
        email: "user@example.test",
        role: "user",
        tenantId: "tenant-a",
        isAdmin: false,
        accountStatus: "active",
        displayName: "Demo User"
      },
      {
        id: "user-2",
        email: "other@example.test",
        role: "user",
        tenantId: "tenant-a",
        isAdmin: false,
        accountStatus: "active",
        displayName: "Other User"
      },
      {
        id: "manager-1",
        email: "manager@example.test",
        role: "manager",
        tenantId: "tenant-a",
        isAdmin: false,
        accountStatus: "active",
        displayName: "Demo Manager"
      },
      {
        id: "admin-1",
        email: "admin@example.test",
        role: "admin",
        tenantId: "tenant-a",
        isAdmin: true,
        accountStatus: "active",
        displayName: "Demo Admin"
      },
      {
        id: "tenant-b-user-1",
        email: "tenant-b-user@example.test",
        role: "user",
        tenantId: "tenant-b",
        isAdmin: false,
        accountStatus: "active",
        displayName: "Tenant B User"
      }
    ],
    profiles: [
      {
        id: "profile-user-1",
        userId: "user-1",
        ownerId: "user-1",
        tenantId: "tenant-a",
        displayName: "Demo User",
        bio: "Owned by user-1"
      },
      {
        id: "profile-owned-by-user-2",
        userId: "user-2",
        ownerId: "user-2",
        tenantId: "tenant-a",
        displayName: "Other User",
        bio: "Owned by user-2"
      }
    ],
    orders: [
      {
        id: "order-user-1",
        userId: "user-1",
        tenantId: "tenant-a",
        total: 42,
        status: "open"
      },
      {
        id: "order-owned-by-user-2",
        userId: "user-2",
        tenantId: "tenant-a",
        total: 84,
        status: "shipped"
      }
    ],
    payments: [
      {
        id: "payment-user-1",
        userId: "user-1",
        customerId: "user-1",
        tenantId: "tenant-a",
        amount: 42,
        paymentStatus: "pending",
        approvalId: "approval-user-1"
      },
      {
        id: "payment-owned-by-user-2",
        userId: "user-2",
        customerId: "user-2",
        tenantId: "tenant-a",
        amount: 84,
        paymentStatus: "pending",
        approvalId: "approval-owned-by-user-2"
      }
    ],
    tickets: [
      {
        id: "ticket-user-1",
        userId: "user-1",
        ownerId: "user-1",
        tenantId: "tenant-a",
        subject: "User 1 support ticket",
        status: "open"
      },
      {
        id: "ticket-owned-by-user-2",
        userId: "user-2",
        ownerId: "user-2",
        tenantId: "tenant-a",
        subject: "User 2 support ticket",
        status: "open"
      }
    ],
    approvals: [
      {
        id: "approval-draft",
        userId: "user-1",
        ownerId: "user-1",
        tenantId: "tenant-a",
        approvalState: "draft",
        amount: 18
      },
      {
        id: "approval-user-1",
        userId: "user-1",
        ownerId: "user-1",
        tenantId: "tenant-a",
        approvalState: "submitted",
        amount: 42
      },
      {
        id: "approval-owned-by-user-2",
        userId: "user-2",
        ownerId: "user-2",
        tenantId: "tenant-a",
        approvalState: "submitted",
        amount: 84
      },
      {
        id: "approval-rejected",
        userId: "user-1",
        ownerId: "user-1",
        tenantId: "tenant-a",
        approvalState: "rejected",
        amount: 21
      },
      {
        id: "approval-paid",
        userId: "user-1",
        ownerId: "user-1",
        tenantId: "tenant-a",
        approvalState: "paid",
        amount: 99
      }
    ],
    inventory: [
      {
        id: "inv-1",
        sku: "SAFE-001",
        name: "Demo inventory item",
        quantity: 12
      }
    ],
    webhookDeliveries: new Set<string>(["demo-delivery-id"])
  };
}
