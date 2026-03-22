CREATE TABLE products (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NOT NULL DEFAULT '',
    price       DECIMAL(18,2) NOT NULL DEFAULT 0,
    stock       INT           NOT NULL DEFAULT 0,
    created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);
