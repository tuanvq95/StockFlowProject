package product

import "time"

type Product struct {
	ID          int64     `db:"id"          json:"id"`
	Name        string    `db:"name"        json:"name"`
	Description string    `db:"description" json:"description"`
	Price       float64   `db:"price"       json:"price"`
	Stock       int       `db:"stock"       json:"stock"`
	CreatedAt   time.Time `db:"created_at"  json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"  json:"updated_at"`
}

type CreateProductRequest struct {
	Name        string  `json:"name"        binding:"required,min=1"`
	Description string  `json:"description"`
	Price       float64 `json:"price"       binding:"required,min=0"`
	Stock       int     `json:"stock"       binding:"min=0"`
}

type UpdateProductRequest struct {
	Name        string  `json:"name"        binding:"omitempty,min=1"`
	Description string  `json:"description"`
	Price       float64 `json:"price"       binding:"omitempty,min=0"`
	Stock       int     `json:"stock"       binding:"omitempty,min=0"`
}

type PageQuery struct {
	Page     int      `form:"page"`
	PageSize int      `form:"page_size"`
	Search   string   `form:"search"`
	MinPrice *float64 `form:"min_price"`
	MaxPrice *float64 `form:"max_price"`
	MinStock *int     `form:"min_stock"`
	MaxStock *int     `form:"max_stock"`
}

type PagedResult struct {
	Items      []Product `json:"items"`
	Total      int64     `json:"total"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
	TotalPages int       `json:"total_pages"`
}
