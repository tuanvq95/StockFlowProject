package warehouse

import (
	"context"
	"errors"
	"fmt"
	"time"
)

type Service interface {
	GetPaged(ctx context.Context, q TxPageQuery) (PagedResult, error)
	GetByID(ctx context.Context, id int64) (*Transaction, error)
	Create(ctx context.Context, req CreateTransactionRequest) (*Transaction, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetPaged(ctx context.Context, q TxPageQuery) (PagedResult, error) {
	return s.repo.FindPaged(ctx, q)
}

func (s *service) GetByID(ctx context.Context, id int64) (*Transaction, error) {
	tx, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("transaction not found")
	}
	return tx, nil
}

func (s *service) Create(ctx context.Context, req CreateTransactionRequest) (*Transaction, error) {
	if req.Type != TxImport && req.Type != TxExport {
		return nil, errors.New("type must be IMPORT or EXPORT")
	}
	if len(req.Items) == 0 {
		return nil, errors.New("at least one item is required")
	}
	for _, item := range req.Items {
		if item.ProductID <= 0 {
			return nil, errors.New("all items must have a valid product")
		}
		if item.Quantity <= 0 {
			return nil, errors.New("quantity must be greater than 0")
		}
	}
	txCode := generateTxCode(req.Type)
	return s.repo.Create(ctx, req, txCode)
}

func generateTxCode(txType TxType) string {
	prefix := "IMP"
	if txType == TxExport {
		prefix = "EXP"
	}
	now := time.Now()
	return fmt.Sprintf("%s-%s-%06d",
		prefix,
		now.Format("20060102"),
		now.UnixNano()%1_000_000,
	)
}
