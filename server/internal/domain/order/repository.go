package order

import (
	"context"
	"fmt"
	"math"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	FindPaged(ctx context.Context, q PageQuery) (PagedResult, error)
	FindByID(ctx context.Context, id int64) (*Order, error)
	FindByCode(ctx context.Context, code string) (*Order, error)
	Create(ctx context.Context, req CreateOrderRequest, orderCode string) (*Order, error)
	UpdateStatus(ctx context.Context, id int64, status OrderStatus) (*Order, error)
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindPaged(ctx context.Context, q PageQuery) (PagedResult, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.PageSize < 1 || q.PageSize > 100 {
		q.PageSize = 10
	}
	offset := (q.Page - 1) * q.PageSize

	where := "WHERE 1=1"
	args := []any{}
	argIdx := 1

	if q.Status != "" {
		where += fmt.Sprintf(" AND o.status = @p%d", argIdx)
		args = append(args, q.Status)
		argIdx++
	}
	if q.Search != "" {
		where += fmt.Sprintf(" AND (o.customer_name LIKE @p%d OR o.customer_phone LIKE @p%d OR o.order_code LIKE @p%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+q.Search+"%")
		argIdx++
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM orders o %s`, where)
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return PagedResult{}, err
	}

	dataQuery := fmt.Sprintf(`
		SELECT o.id, o.order_code, o.customer_name, o.customer_phone,
		       o.status, o.note, o.total_amount, o.created_at, o.updated_at
		FROM orders o
		%s
		ORDER BY o.id DESC
		OFFSET @p%d ROWS FETCH NEXT @p%d ROWS ONLY`,
		where, argIdx, argIdx+1,
	)
	args = append(args, offset, q.PageSize)

	orders := make([]Order, 0)
	if err := r.db.SelectContext(ctx, &orders, dataQuery, args...); err != nil {
		return PagedResult{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(q.PageSize)))
	if totalPages < 1 {
		totalPages = 1
	}
	return PagedResult{
		Items:      orders,
		Total:      total,
		Page:       q.Page,
		PageSize:   q.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *repository) FindByID(ctx context.Context, id int64) (*Order, error) {
	var o Order
	err := r.db.GetContext(ctx, &o, `
		SELECT id, order_code, customer_name, customer_phone,
		       status, note, total_amount, created_at, updated_at
		FROM orders WHERE id = @p1`, id)
	if err != nil {
		return nil, err
	}
	return r.loadItems(ctx, &o)
}

func (r *repository) FindByCode(ctx context.Context, code string) (*Order, error) {
	var o Order
	err := r.db.GetContext(ctx, &o, `
		SELECT id, order_code, customer_name, customer_phone,
		       status, note, total_amount, created_at, updated_at
		FROM orders WHERE order_code = @p1`, code)
	if err != nil {
		return nil, err
	}
	return r.loadItems(ctx, &o)
}

func (r *repository) loadItems(ctx context.Context, o *Order) (*Order, error) {
	items := make([]OrderItem, 0)
	if err := r.db.SelectContext(ctx, &items, `
		SELECT id, order_id, product_id, product_name, quantity, unit_price
		FROM order_items WHERE order_id = @p1 ORDER BY id`, o.ID); err != nil {
		return nil, err
	}
	o.Items = items
	return o, nil
}

func (r *repository) Create(ctx context.Context, req CreateOrderRequest, orderCode string) (*Order, error) {
	dbtx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer dbtx.Rollback()

	// Calculate total
	var total float64
	for _, item := range req.Items {
		total += float64(item.Quantity) * item.UnitPrice
	}

	var orderID int64
	err = dbtx.QueryRowContext(ctx, `
		INSERT INTO orders (order_code, customer_name, customer_phone, note, total_amount)
		OUTPUT INSERTED.id
		VALUES (@p1, @p2, @p3, @p4, @p5)`,
		orderCode, req.CustomerName, req.CustomerPhone, req.Note, total,
	).Scan(&orderID)
	if err != nil {
		return nil, err
	}

	for _, item := range req.Items {
		_, err = dbtx.ExecContext(ctx, `
			INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
			VALUES (@p1, @p2, @p3, @p4, @p5)`,
			orderID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice,
		)
		if err != nil {
			return nil, err
		}
	}

	if err = dbtx.Commit(); err != nil {
		return nil, err
	}

	return r.FindByID(ctx, orderID)
}

func (r *repository) UpdateStatus(ctx context.Context, id int64, status OrderStatus) (*Order, error) {
	_, err := r.db.ExecContext(ctx, `
		UPDATE orders SET status = @p1, updated_at = GETDATE() WHERE id = @p2`,
		string(status), id)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}
