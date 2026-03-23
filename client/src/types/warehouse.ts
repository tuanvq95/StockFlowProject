export type TxType = "IMPORT" | "EXPORT";

export interface WarehouseTransaction {
  id: number;
  tx_code: string;
  type: TxType;
  note: string;
  created_at: string;
  total_amount: number;
  item_count: number;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateTransactionRequest {
  type: TxType;
  note: string;
  items: CreateItemRequest[];
}

export interface CreateItemRequest {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface WPagedResult {
  items: WarehouseTransaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
