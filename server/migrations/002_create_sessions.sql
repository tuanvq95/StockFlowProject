DROP TABLE IF EXISTS sessions;
GO

CREATE TABLE sessions (
    id         BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id    BIGINT        NOT NULL,
    token      NVARCHAR(512) NOT NULL,
    expires_at DATETIME2     NOT NULL,
    created_at DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for sessions table
CREATE INDEX idx_sessions_token     ON sessions(token);
CREATE INDEX idx_sessions_user_id   ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);