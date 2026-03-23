export type OrderStatus =
  | "PENDING"
  | "PACKING"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Lên đơn",
  PACKING: "Đóng gói",
  DELIVERING: "Giao đơn",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ORDER_STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["PACKING", "CANCELLED"],
  PACKING: ["DELIVERING", "CANCELLED"],
  DELIVERING: ["COMPLETED", "CANCELLED"],
};

export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  note: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  note: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderPagedResult {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
