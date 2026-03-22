package user

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	FindAll(ctx context.Context) ([]User, error)
	FindByID(ctx context.Context, id int64) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Create(ctx context.Context, u *User) error
	Update(ctx context.Context, u *User) error
	Delete(ctx context.Context, id int64) error
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindAll(ctx context.Context) ([]User, error) {
	var users []User
	query := `SELECT id, name, email, created_at FROM users ORDER BY id`
	err := r.db.SelectContext(ctx, &users, query)
	return users, err
}

func (r *repository) FindByID(ctx context.Context, id int64) (*User, error) {
	var u User
	query := `SELECT id, name, email, created_at FROM users WHERE id = @p1`
	err := r.db.GetContext(ctx, &u, query, id)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	query := `SELECT id, name, email, password, created_at FROM users WHERE email = @p1`
	err := r.db.GetContext(ctx, &u, query, email)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *repository) Create(ctx context.Context, u *User) error {
	query := `
        INSERT INTO users (name, email, password)
        OUTPUT INSERTED.id, INSERTED.created_at
        VALUES (@p1, @p2, @p3)`
	return r.db.QueryRowContext(ctx, query, u.Name, u.Email, u.Password).
		Scan(&u.ID, &u.CreatedAt)
}

func (r *repository) Update(ctx context.Context, u *User) error {
	query := `UPDATE users SET name = @p1, email = @p2 WHERE id = @p3`
	_, err := r.db.ExecContext(ctx, query, u.Name, u.Email, u.ID)
	return err
}

func (r *repository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM users WHERE id = @p1`, id)
	return err
}
