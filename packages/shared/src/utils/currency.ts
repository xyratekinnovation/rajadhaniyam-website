export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export const calculateDiscountPercent = (mrp: number, price: number) =>
  mrp <= 0 ? 0 : Math.round(((mrp - price) / mrp) * 100);
