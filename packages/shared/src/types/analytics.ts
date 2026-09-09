export type RecentOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
};

export type AnalyticsSummary = {
  revenueLast30Days: number;
  ordersLast30Days: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: RecentOrderSummary[];
};
