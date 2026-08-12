export enum Role {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  WAREHOUSE = 'WAREHOUSE',
  ACCOUNTS = 'ACCOUNTS',
}

export enum CustomerType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  DISTRIBUTOR = 'DISTRIBUTOR',
}

export enum CustomerStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum ChallanStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
