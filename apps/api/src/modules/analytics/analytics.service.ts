import { prisma } from "@rajadhaniyam/database";
import type { AnalyticsSummary } from "@rajadhaniyam/shared";

const RECENT_ORDERS_LIMIT = 5;

// Cancelled/refunded orders never became real revenue — excluding them from
// both the count and the sum, not just the sum, so "orders" and "revenue"
// describe the same set of orders.
const REVENUE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export const analyticsService = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [revenueAgg, ordersCount, totalProducts, totalCustomers, recentOrderRows] =
      await Promise.all([
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: thirtyDaysAgo }, status: { in: [...REVENUE_STATUSES] } },
        }),
        prisma.order.count({
          where: { createdAt: { gte: thirtyDaysAgo }, status: { in: [...REVENUE_STATUSES] } },
        }),
        prisma.product.count(),
        prisma.user.count(),
        prisma.order.findMany({
          take: RECENT_ORDERS_LIMIT,
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, shippingSnapshot: true },
        }),
      ]);

    return {
      revenueLast30Days: Number(revenueAgg._sum.total ?? 0),
      ordersLast30Days: ordersCount,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrderRows.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: (row.shippingSnapshot as { fullName?: string })?.fullName ?? "—",
        total: Number(row.total),
        status: row.status.toLowerCase(),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  },
};
