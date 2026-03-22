package user

import "time"

type User struct {
	ID        int64     `db:"id"         json:"id"`
	Name      string    `db:"name"       json:"name"`
	Email     string    `db:"email"      json:"email"`
	Password  string    `db:"password"   json:"-"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type CreateUserRequest struct {
	Name     string `json:"name"     binding:"required,min=2"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type UpdateUserRequest struct {
	Name  string `json:"name"  binding:"omitempty,min=2"`
	Email string `json:"email" binding:"omitempty,email"`
}
