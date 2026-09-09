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

export type Category = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  image: string;
};
