package user

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	GetAll(ctx context.Context) ([]User, error)
	GetByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, req CreateUserRequest) (*User, error)
	Update(ctx context.Context, id int64, req UpdateUserRequest) (*User, error)
	Delete(ctx context.Context, id int64) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetAll(ctx context.Context) ([]User, error) {
	return s.repo.FindAll(ctx)
}

func (s *service) GetByID(ctx context.Context, id int64) (*User, error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return u, nil
}

func (s *service) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
	// Check if email is already in use
	if existing, _ := s.repo.FindByEmail(ctx, req.Email); existing != nil {
		return nil, errors.New("email already in use")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashed),
	}

	if err := s.repo.Create(ctx, u); err != nil {
		return nil, err
	}

	return u, nil
}

func (s *service) Update(ctx context.Context, id int64, req UpdateUserRequest) (*User, error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.Name != "" {
		u.Name = req.Name
	}
	if req.Email != "" {
		u.Email = req.Email
	}

	return u, s.repo.Update(ctx, u)
}

func (s *service) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}
