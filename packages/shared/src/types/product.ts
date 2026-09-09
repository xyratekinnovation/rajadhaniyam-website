export type ProductNutritionFact = {
  label: string;
  value: string;
};

/**
 * Canonical product shape shared across storefront, admin and API.
 * Field names match the original hardcoded shop data so existing UI code
 * keeps working unchanged; DB-oriented fields are optional for now and
 * become required once ProductVariant-backed products replace mock data.
 */
export type Product = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  categorySlug: string;
  categoryId?: string;
  price: number;
  mrp: number;
  weight: string;
  weights: string[];
  image: string;
  images?: string[];
  bestseller?: boolean;
  featured?: boolean;
  status?: "draft" | "active" | "archived";
  inStock: boolean;
  rating: number;
  reviews: number;
  description: string;
  ingredients: string;
  nutrition: ProductNutritionFact[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  weight: string;
  price: number;
  mrp: number;
  stock: number;
  active: boolean;
};

/**
 * Admin-only detail view: the flattened `Product` DTO above collapses all
 * variants down to one price/mrp/weight/inStock for the storefront's display
 * needs, which loses real per-variant price/stock data. Editing a product
 * from that flattened shape would silently reset every variant's real stock
 * to a placeholder. `variantsDetail` carries the real per-variant data the
 * admin edit form needs to round-trip correctly.
 */
export type ProductAdminDetail = Product & {
  variantsDetail: Array<{ weight: string; price: number; mrp: number; stock: number }>;
};

export type Category = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  image: string;
};
