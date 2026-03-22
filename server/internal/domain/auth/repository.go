package auth

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	FindUserByEmail(ctx context.Context, email string) (*UserRow, error)
	FindUserByID(ctx context.Context, id int64) (*UserRow, error)
	SaveSession(ctx context.Context, session *Session) error
	FindSession(ctx context.Context, token string) (*Session, error)
	DeleteSession(ctx context.Context, token string) error
	DeleteExpiredSessions(ctx context.Context, userID int64) error
}

// UserRow is a struct that maps to the users table in the database. It includes the password hash for authentication purposes.
type UserRow struct {
	ID       int64  `db:"id"`
	Name     string `db:"name"`
	Email    string `db:"email"`
	Password string `db:"password"`
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

// FindUserByEmail retrieves a user from the database by their email address. It returns a UserRow struct that includes the user's ID, name, email, and password hash.
func (r *repository) FindUserByEmail(ctx context.Context, email string) (*UserRow, error) {
	var u UserRow
	query := `SELECT id, name, email, password FROM users WHERE email = @p1`
	if err := r.db.GetContext(ctx, &u, query, email); err != nil {
		return nil, err
	}
	return &u, nil
}

// FindUserByID retrieves a user from the database by their ID.
func (r *repository) FindUserByID(ctx context.Context, id int64) (*UserRow, error) {
	var u UserRow
	query := `SELECT id, name, email, password FROM users WHERE id = @p1`
	if err := r.db.GetContext(ctx, &u, query, id); err != nil {
		return nil, err
	}
	return &u, nil
}

// SaveSession inserts a new session into the database and returns the generated session ID and creation time. It takes a Session struct as input, which includes the user ID, token, and expiration time.
func (r *repository) SaveSession(ctx context.Context, s *Session) error {
	query := `
        INSERT INTO sessions (user_id, token, expires_at)
        OUTPUT INSERTED.id, INSERTED.created_at
        VALUES (@p1, @p2, @p3)`
	return r.db.QueryRowContext(ctx, query, s.UserID, s.Token, s.ExpiresAt).
		Scan(&s.ID, &s.CreatedAt)
}

// FindSession retrieves a session from the database by its token. It returns a Session struct that includes the session ID, user ID, token, expiration time, and creation time. The query also checks that the session has not expired by comparing the expires_at field with the current date and time.
func (r *repository) FindSession(ctx context.Context, token string) (*Session, error) {
	var s Session
	query := `
        SELECT id, user_id, token, expires_at, created_at
        FROM sessions
        WHERE token = @p1 AND expires_at > GETDATE()`
	if err := r.db.GetContext(ctx, &s, query, token); err != nil {
		return nil, err
	}
	return &s, nil
}

// DeleteSession removes a session from the database based on its token. This is typically used when a user logs out or when a session needs to be invalidated for security reasons.
func (r *repository) DeleteSession(ctx context.Context, token string) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM sessions WHERE token = @p1`, token)
	return err
}

// DeleteExpiredSessions removes all sessions for a user that have expired. This is typically called during login to clean up old sessions and ensure that only active sessions remain in the database.
func (r *repository) DeleteExpiredSessions(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM sessions WHERE user_id = @p1 AND expires_at <= GETDATE()`, userID)
	return err
}

// CleanupAllSessions deletes all sessions for a user, used when they change their password or want to log out from all devices.
func (r *repository) DeleteAllUserSessions(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM sessions WHERE user_id = @p1`, userID)
	return err
}
