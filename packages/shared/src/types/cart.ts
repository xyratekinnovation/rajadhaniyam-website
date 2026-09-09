export type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  weight: string;
  price: number;
  qty: number;
};

export type Cart = {
  id?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
};
