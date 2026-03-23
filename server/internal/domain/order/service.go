package order

import (
	"context"
	"errors"
	"fmt"
	"time"
)

type Service interface {
	GetPaged(ctx context.Context, q PageQuery) (PagedResult, error)
	GetByID(ctx context.Context, id int64) (*Order, error)
	GetByCode(ctx context.Context, code string) (*Order, error)
	Create(ctx context.Context, req CreateOrderRequest) (*Order, error)
	UpdateStatus(ctx context.Context, id int64, req UpdateStatusRequest) (*Order, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetPaged(ctx context.Context, q PageQuery) (PagedResult, error) {
	return s.repo.FindPaged(ctx, q)
}

func (s *service) GetByID(ctx context.Context, id int64) (*Order, error) {
	o, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("order not found")
	}
	return o, nil
}

func (s *service) GetByCode(ctx context.Context, code string) (*Order, error) {
	o, err := s.repo.FindByCode(ctx, code)
	if err != nil {
		return nil, errors.New("order not found")
	}
	return o, nil
}

func (s *service) Create(ctx context.Context, req CreateOrderRequest) (*Order, error) {
	if len(req.Items) == 0 {
		return nil, errors.New("at least one item is required")
	}
	for _, item := range req.Items {
		if item.Quantity <= 0 {
			return nil, errors.New("quantity must be greater than 0")
		}
	}
	orderCode := generateOrderCode()
	return s.repo.Create(ctx, req, orderCode)
}

func (s *service) UpdateStatus(ctx context.Context, id int64, req UpdateStatusRequest) (*Order, error) {
	current, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("order not found")
	}

	allowed, ok := ValidNextStatuses[current.Status]
	if !ok {
		return nil, errors.New("invalid current status")
	}
	valid := false
	for _, s := range allowed {
		if s == req.Status {
			valid = true
			break
		}
	}
	if !valid {
		return nil, fmt.Errorf("cannot transition from %s to %s", current.Status, req.Status)
	}

	return s.repo.UpdateStatus(ctx, id, req.Status)
}

func generateOrderCode() string {
	now := time.Now()
	return fmt.Sprintf("ORD-%s-%06d",
		now.Format("20060102"),
		now.UnixNano()%1_000_000,
	)
}
