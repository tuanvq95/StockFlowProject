package warehouse

import (
	"context"
	"fmt"
	"math"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	FindPaged(ctx context.Context, q TxPageQuery) (PagedResult, error)
	FindByID(ctx context.Context, id int64) (*Transaction, error)
	Create(ctx context.Context, req CreateTransactionRequest, txCode string) (*Transaction, error)
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindPaged(ctx context.Context, q TxPageQuery) (PagedResult, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.PageSize < 1 || q.PageSize > 100 {
		q.PageSize = 10
	}
	offset := (q.Page - 1) * q.PageSize

	where := ""
	args := []any{}
	if q.TxType != "" {
		where = "WHERE t.type = @p1"
		args = append(args, q.TxType)
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM stock_transactions t %s`, where)
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return PagedResult{}, err
	}

	pageArgIdx := len(args) + 1
	offsetArgIdx := len(args) + 2
	dataQuery := fmt.Sprintf(`
		SELECT t.id, t.tx_code, t.type, t.note, t.created_at,
		       ISNULL(SUM(i.quantity * i.unit_price), 0) AS total_amount,
		       COUNT(i.id) AS item_count
		FROM stock_transactions t
		LEFT JOIN stock_transaction_items i ON i.transaction_id = t.id
		%s
		GROUP BY t.id, t.tx_code, t.type, t.note, t.created_at
		ORDER BY t.id DESC
		OFFSET @p%d ROWS FETCH NEXT @p%d ROWS ONLY`,
		where, pageArgIdx, offsetArgIdx,
	)
	args = append(args, offset, q.PageSize)

	txs := make([]Transaction, 0)
	if err := r.db.SelectContext(ctx, &txs, dataQuery, args...); err != nil {
		return PagedResult{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(q.PageSize)))
	return PagedResult{
		Items:      txs,
		Total:      total,
		Page:       q.Page,
		PageSize:   q.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *repository) FindByID(ctx context.Context, id int64) (*Transaction, error) {
	txQuery := `
		SELECT t.id, t.tx_code, t.type, t.note, t.created_at,
		       ISNULL(SUM(i.quantity * i.unit_price), 0) AS total_amount,
		       COUNT(i.id) AS item_count
		FROM stock_transactions t
		LEFT JOIN stock_transaction_items i ON i.transaction_id = t.id
		WHERE t.id = @p1
		GROUP BY t.id, t.tx_code, t.type, t.note, t.created_at`

	var tx Transaction
	if err := r.db.GetContext(ctx, &tx, txQuery, id); err != nil {
		return nil, err
	}

	itemsQuery := `
		SELECT i.id, i.transaction_id, i.product_id, i.quantity, i.unit_price,
		       p.name AS product_name
		FROM stock_transaction_items i
		JOIN products p ON p.id = i.product_id
		WHERE i.transaction_id = @p1
		ORDER BY i.id`

	items := make([]Item, 0)
	if err := r.db.SelectContext(ctx, &items, itemsQuery, id); err != nil {
		return nil, err
	}
	tx.Items = items
	return &tx, nil
}

func (r *repository) Create(ctx context.Context, req CreateTransactionRequest, txCode string) (*Transaction, error) {
	dbtx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer dbtx.Rollback()

	var txID int64
	err = dbtx.QueryRowContext(ctx,
		`INSERT INTO stock_transactions (type, note, tx_code) OUTPUT INSERTED.id VALUES (@p1, @p2, @p3)`,
		string(req.Type), req.Note, txCode,
	).Scan(&txID)
	if err != nil {
		return nil, err
	}

	for _, item := range req.Items {
		if req.Type == TxExport {
			var currentStock int
			err = dbtx.QueryRowContext(ctx,
				`SELECT stock FROM products WHERE id = @p1`,
				item.ProductID,
			).Scan(&currentStock)
			if err != nil {
				return nil, fmt.Errorf("product %d not found", item.ProductID)
			}
			if currentStock < item.Quantity {
				return nil, fmt.Errorf("insufficient stock for product %d: have %d, need %d",
					item.ProductID, currentStock, item.Quantity)
			}
		}

		_, err = dbtx.ExecContext(ctx,
			`INSERT INTO stock_transaction_items (transaction_id, product_id, quantity, unit_price)
			 VALUES (@p1, @p2, @p3, @p4)`,
			txID, item.ProductID, item.Quantity, item.UnitPrice,
		)
		if err != nil {
			return nil, err
		}

		if req.Type == TxImport {
			_, err = dbtx.ExecContext(ctx,
				`UPDATE products SET stock = stock + @p1, updated_at = GETDATE() WHERE id = @p2`,
				item.Quantity, item.ProductID,
			)
		} else {
			_, err = dbtx.ExecContext(ctx,
				`UPDATE products SET stock = stock - @p1, updated_at = GETDATE() WHERE id = @p2`,
				item.Quantity, item.ProductID,
			)
		}
		if err != nil {
			return nil, err
		}
	}

	if err = dbtx.Commit(); err != nil {
		return nil, err
	}

	return r.FindByID(ctx, txID)
}
