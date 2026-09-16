import { prisma } from "@rajadhaniyam/database";
import type { Address, Customer, Order } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { ordersService } from "../orders/orders.service";

function toCustomer(
  row: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    _count?: { orders: number };
  },
): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt.toISOString(),
    orderCount: row._count?.orders,
  };
}

function toAddress(row: {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}): Address {
  return {
    id: row.id,
    customerId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 ?? undefined,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    isDefault: row.isDefault,
  };
}

export const customersService = {
  list: async (): Promise<Customer[]> => {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });
    return rows.map(toCustomer);
  },

  getById: async (id: string): Promise<Customer | undefined> => {
    const row = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    return row ? toCustomer(row) : undefined;
  },

  listAddresses: async (id: string): Promise<Address[]> => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "Customer not found");

    const rows = await prisma.address.findMany({
      where: { userId: id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return rows.map(toAddress);
  },

  listOrders: async (id: string): Promise<Order[]> => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "Customer not found");
    return ordersService.listForCustomer(id);
  },
};
