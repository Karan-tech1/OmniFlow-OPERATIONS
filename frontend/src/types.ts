export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Customer = {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  type: string;
  status: string;
  nextFollowUpAt?: string;
  email?: string;
  address?: string;
  notes?: string;
  gstNumber?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string | null;
  currentStock: number;
  minimumStock: number;
  unitPrice: string | number;
  categoryId?: string;
  warehouseId?: string;
  category?: { name: string };
  warehouse?: { name: string };
};

export type ChallanItem = {
  id?: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number | string;
  quantity: number;
};

export type SalesChallan = {
  id: string;
  challanNumber: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  paymentMode?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | null;
  paidAmount: number | string;
  outstandingBalance: number | string;
  createdAt: string;
  customer: Customer;
  createdBy: { name: string };
  items: ChallanItem[];
};
