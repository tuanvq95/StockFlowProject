package product

import (
	"context"
	"errors"
)

type Service interface {
	GetAll(ctx context.Context) ([]Product, error)
	GetPaged(ctx context.Context, q PageQuery) (PagedResult, error)
	GetByID(ctx context.Context, id int64) (*Product, error)
	Create(ctx context.Context, req CreateProductRequest) (*Product, error)
	Update(ctx context.Context, id int64, req UpdateProductRequest) (*Product, error)
	Delete(ctx context.Context, id int64) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetAll(ctx context.Context) ([]Product, error) {
	return s.repo.FindAll(ctx)
}

func (s *service) GetPaged(ctx context.Context, q PageQuery) (PagedResult, error) {
	return s.repo.FindPaged(ctx, q)
}

func (s *service) GetByID(ctx context.Context, id int64) (*Product, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("product not found")
	}
	return p, nil
}

func (s *service) Create(ctx context.Context, req CreateProductRequest) (*Product, error) {
	p := &Product{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, errors.New("could not create product")
	}
	return p, nil
}

func (s *service) Update(ctx context.Context, id int64, req UpdateProductRequest) (*Product, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Description != "" {
		p.Description = req.Description
	}
	if req.Price > 0 {
		p.Price = req.Price
	}
	if req.Stock >= 0 {
		p.Stock = req.Stock
	}
	if err := s.repo.Update(ctx, p); err != nil {
		return nil, errors.New("could not update product")
	}
	return p, nil
}

func (s *service) Delete(ctx context.Context, id int64) error {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return errors.New("product not found")
	}
	return s.repo.Delete(ctx, id)
}
