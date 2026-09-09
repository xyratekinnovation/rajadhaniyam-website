import { prisma } from "@rajadhaniyam/database";
import type { Address, Customer } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { signAdminToken, signCustomerToken } from "../../utils/jwt";

function toCustomer(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
}): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt.toISOString(),
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

export const authService = {
  register: async (input: { email: string; password: string; name: string }) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await Bun.password.hash(input.password);
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
    });

    return { token: await signCustomerToken(user.id), customer: toCustomer(user) };
  },

  login: async (input: { email: string; password: string }) => {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await Bun.password.verify(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    return { token: await signCustomerToken(user.id), customer: toCustomer(user) };
  },

  adminLogin: async (input: { email: string; password: string }) => {
    const admin = await prisma.adminUser.findUnique({ where: { email: input.email } });
    if (!admin || !(await Bun.password.verify(input.password, admin.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    return {
      token: await signAdminToken(admin.id, admin.role),
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  },

  me: async (userId: string): Promise<Customer> => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toCustomer(user);
  },

  listAddresses: async (userId: string): Promise<Address[]> => {
    const rows = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return rows.map(toAddress);
  },

  createAddress: async (
    userId: string,
    input: Omit<Address, "id" | "customerId">,
  ): Promise<Address> => {
    // Only one default address per customer — demoting the rest in the same
    // transaction avoids a race between "unset old default" and "set new one".
    const row = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.create({ data: { ...input, userId } });
    });
    return toAddress(row);
  },

  updateAddress: async (
    userId: string,
    addressId: string,
    input: Omit<Address, "id" | "customerId">,
  ): Promise<Address> => {
    await assertOwnsAddress(userId, addressId);
    const row = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id: addressId }, data: input });
    });
    return toAddress(row);
  },

  removeAddress: async (userId: string, addressId: string): Promise<void> => {
    await assertOwnsAddress(userId, addressId);
    await prisma.address.delete({ where: { id: addressId } });
  },
};

async function assertOwnsAddress(userId: string, addressId: string): Promise<void> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new HttpError(404, "Address not found");
  }
}
