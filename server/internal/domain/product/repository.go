package product

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	FindAll(ctx context.Context) ([]Product, error)
	FindPaged(ctx context.Context, q PageQuery) (PagedResult, error)
	FindByID(ctx context.Context, id int64) (*Product, error)
	Create(ctx context.Context, p *Product) error
	Update(ctx context.Context, p *Product) error
	Delete(ctx context.Context, id int64) error
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindAll(ctx context.Context) ([]Product, error) {
	products := make([]Product, 0)
	query := `SELECT id, name, description, price, stock, created_at, updated_at FROM products ORDER BY id`
	err := r.db.SelectContext(ctx, &products, query)
	return products, err
}

func (r *repository) FindPaged(ctx context.Context, q PageQuery) (PagedResult, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.PageSize < 1 || q.PageSize > 100 {
		q.PageSize = 10
	}
	offset := (q.Page - 1) * q.PageSize

	conditions := []string{}
	args := []any{}

	if q.Search != "" {
		pIdx := len(args) + 1
		conditions = append(conditions, fmt.Sprintf("(name LIKE @p%d OR description LIKE @p%d)", pIdx, pIdx))
		args = append(args, "%"+q.Search+"%")
	}
	if q.MinPrice != nil {
		pIdx := len(args) + 1
		conditions = append(conditions, fmt.Sprintf("price >= @p%d", pIdx))
		args = append(args, *q.MinPrice)
	}
	if q.MaxPrice != nil {
		pIdx := len(args) + 1
		conditions = append(conditions, fmt.Sprintf("price <= @p%d", pIdx))
		args = append(args, *q.MaxPrice)
	}
	if q.MinStock != nil {
		pIdx := len(args) + 1
		conditions = append(conditions, fmt.Sprintf("stock >= @p%d", pIdx))
		args = append(args, *q.MinStock)
	}
	if q.MaxStock != nil {
		pIdx := len(args) + 1
		conditions = append(conditions, fmt.Sprintf("stock <= @p%d", pIdx))
		args = append(args, *q.MaxStock)
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM products %s`, where)
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return PagedResult{}, err
	}

	// Paginated rows ? SQL Server 2012+ OFFSET/FETCH
	pageArgIdx := len(args) + 1
	offsetArgIdx := len(args) + 2
	dataQuery := fmt.Sprintf(`
		SELECT id, name, description, price, stock, created_at, updated_at
		FROM products %s
		ORDER BY id
		OFFSET @p%d ROWS FETCH NEXT @p%d ROWS ONLY`,
		where, pageArgIdx, offsetArgIdx,
	)
	args = append(args, offset, q.PageSize)

	items := make([]Product, 0)
	if err := r.db.SelectContext(ctx, &items, dataQuery, args...); err != nil {
		return PagedResult{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(q.PageSize)))

	return PagedResult{
		Items:      items,
		Total:      total,
		Page:       q.Page,
		PageSize:   q.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *repository) FindByID(ctx context.Context, id int64) (*Product, error) {
	var p Product
	query := `SELECT id, name, description, price, stock, created_at, updated_at FROM products WHERE id = @p1`
	if err := r.db.GetContext(ctx, &p, query, id); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *repository) Create(ctx context.Context, p *Product) error {
	query := `
		INSERT INTO products (name, description, price, stock)
		OUTPUT INSERTED.id, INSERTED.created_at, INSERTED.updated_at
		VALUES (@p1, @p2, @p3, @p4)`
	return r.db.QueryRowContext(ctx, query, p.Name, p.Description, p.Price, p.Stock).
		Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *repository) Update(ctx context.Context, p *Product) error {
	query := `
		UPDATE products
		SET name = @p1, description = @p2, price = @p3, stock = @p4, updated_at = GETDATE()
		WHERE id = @p5`
	_, err := r.db.ExecContext(ctx, query, p.Name, p.Description, p.Price, p.Stock, p.ID)
	return err
}

func (r *repository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM products WHERE id = @p1`, id)
	return err
}
