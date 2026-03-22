package auth

import (
	"context"
	"errors"
	"go-crud/internal/middleware"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	Logout(ctx context.Context, token string) error
	LogoutAll(ctx context.Context, userID int64) error
	ValidateToken(ctx context.Context, token string) (*Session, error)
	GetMe(ctx context.Context, userID int64) (*UserInfo, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	// 1. find user by email
	u, err := s.repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 2. check password
	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 3. create session
	expiresAt := time.Now().Add(24 * time.Hour)
	tokenStr, err := middleware.GenerateToken(u.ID, u.Email)
	if err != nil {
		return nil, errors.New("could not generate token")
	}

	// 4. delete expired sessions
	_ = s.repo.DeleteExpiredSessions(ctx, u.ID)

	// 5. save session to DB
	session := &Session{
		UserID:    u.ID,
		Token:     tokenStr,
		ExpiresAt: expiresAt,
	}
	if err := s.repo.SaveSession(ctx, session); err != nil {
		return nil, errors.New("could not save session")
	}

	return &LoginResponse{
		Token:     tokenStr,
		ExpiresAt: expiresAt,
		User: UserInfo{
			ID:    u.ID,
			Name:  u.Name,
			Email: u.Email,
		},
	}, nil
}

func (s *service) Logout(ctx context.Context, token string) error {
	// remove token from header "Bearer <token>"
	token = extractRawToken(token)
	if token == "" {
		return errors.New("invalid token format")
	}

	// check if session exists
	if _, err := s.repo.FindSession(ctx, token); err != nil {
		return errors.New("session not found or already expired")
	}

	return s.repo.DeleteSession(ctx, token)
}

func (s *service) LogoutAll(ctx context.Context, userID int64) error {
	repo, ok := s.repo.(*repository)
	if !ok {
		return errors.New("operation not supported")
	}
	return repo.DeleteAllUserSessions(ctx, userID)
}

func (s *service) ValidateToken(ctx context.Context, token string) (*Session, error) {
	return s.repo.FindSession(ctx, token)
}

func (s *service) GetMe(ctx context.Context, userID int64) (*UserInfo, error) {
	u, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &UserInfo{ID: u.ID, Name: u.Name, Email: u.Email}, nil
}

func extractRawToken(authHeader string) string {
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return parts[1]
	}

	// fallback: if the header is just the token without "Bearer " prefix, return it directly (for backward compatibility)
	if !strings.Contains(authHeader, " ") {
		return authHeader
	}
	return ""
}
