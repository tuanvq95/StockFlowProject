package order

import "time"

type OrderStatus string

const (
	StatusPending    OrderStatus = "PENDING"
	StatusPacking    OrderStatus = "PACKING"
	StatusDelivering OrderStatus = "DELIVERING"
	StatusCompleted  OrderStatus = "COMPLETED"
	StatusCancelled  OrderStatus = "CANCELLED"
)

// ValidNextStatuses defines allowed transitions for each status
var ValidNextStatuses = map[OrderStatus][]OrderStatus{
	StatusPending:    {StatusPacking, StatusCancelled},
	StatusPacking:    {StatusDelivering, StatusCancelled},
	StatusDelivering: {StatusCompleted, StatusCancelled},
	StatusCompleted:  {},
	StatusCancelled:  {},
}

type Order struct {
	ID            int64       `db:"id"              json:"id"`
	OrderCode     string      `db:"order_code"      json:"order_code"`
	CustomerName  string      `db:"customer_name"   json:"customer_name"`
	CustomerPhone string      `db:"customer_phone"  json:"customer_phone"`
	Status        OrderStatus `db:"status"          json:"status"`
	Note          string      `db:"note"            json:"note"`
	TotalAmount   float64     `db:"total_amount"    json:"total_amount"`
	CreatedAt     time.Time   `db:"created_at"      json:"created_at"`
	UpdatedAt     time.Time   `db:"updated_at"      json:"updated_at"`
	Items         []OrderItem `db:"-"               json:"items,omitempty"`
}

type OrderItem struct {
	ID          int64   `db:"id"           json:"id"`
	OrderID     int64   `db:"order_id"     json:"order_id"`
	ProductID   int64   `db:"product_id"   json:"product_id"`
	ProductName string  `db:"product_name" json:"product_name"`
	Quantity    int     `db:"quantity"     json:"quantity"`
	UnitPrice   float64 `db:"unit_price"   json:"unit_price"`
}

type CreateOrderRequest struct {
	CustomerName  string              `json:"customer_name"  binding:"required"`
	CustomerPhone string              `json:"customer_phone" binding:"required"`
	Note          string              `json:"note"`
	Items         []CreateItemRequest `json:"items"          binding:"required,min=1"`
}

type CreateItemRequest struct {
	ProductID   int64   `json:"product_id"   binding:"required"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"     binding:"required,min=1"`
	UnitPrice   float64 `json:"unit_price"   binding:"min=0"`
}

type UpdateStatusRequest struct {
	Status OrderStatus `json:"status" binding:"required"`
}

type PageQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Status   string `form:"status"`
	Search   string `form:"search"`
}

type PagedResult struct {
	Items      []Order `json:"items"`
	Total      int64   `json:"total"`
	Page       int     `json:"page"`
	PageSize   int     `json:"page_size"`
	TotalPages int     `json:"total_pages"`
}
