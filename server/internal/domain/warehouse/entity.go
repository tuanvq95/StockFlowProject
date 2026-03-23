package warehouse

import "time"

type TxType string

const (
	TxImport TxType = "IMPORT"
	TxExport TxType = "EXPORT"
)

type Transaction struct {
	ID          int64     `db:"id"           json:"id"`
	TxCode      string    `db:"tx_code"       json:"tx_code"`
	Type        TxType    `db:"type"         json:"type"`
	Note        string    `db:"note"         json:"note"`
	CreatedAt   time.Time `db:"created_at"   json:"created_at"`
	TotalAmount float64   `db:"total_amount" json:"total_amount"`
	ItemCount   int       `db:"item_count"   json:"item_count"`
	Items       []Item    `db:"-"            json:"items,omitempty"`
}

type Item struct {
	ID            int64   `db:"id"             json:"id"`
	TransactionID int64   `db:"transaction_id" json:"transaction_id"`
	ProductID     int64   `db:"product_id"     json:"product_id"`
	ProductName   string  `db:"product_name"   json:"product_name"`
	Quantity      int     `db:"quantity"       json:"quantity"`
	UnitPrice     float64 `db:"unit_price"     json:"unit_price"`
}

type CreateTransactionRequest struct {
	Type  TxType              `json:"type"`
	Note  string              `json:"note"`
	Items []CreateItemRequest `json:"items"`
}

type CreateItemRequest struct {
	ProductID int64   `json:"product_id"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
}

type TxPageQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	TxType   string `form:"type"`
}

type PagedResult struct {
	Items      []Transaction `json:"items"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	PageSize   int           `json:"page_size"`
	TotalPages int           `json:"total_pages"`
}
