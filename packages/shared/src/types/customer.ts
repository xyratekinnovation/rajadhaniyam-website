export type Address = {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
};
