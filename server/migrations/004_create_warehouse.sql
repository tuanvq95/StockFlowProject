-- Drop dependent table first (has FK referencing stock_transactions)
IF OBJECT_ID('dbo.stock_transaction_items', 'U') IS NOT NULL
    DROP TABLE dbo.stock_transaction_items;

-- Drop main table
IF OBJECT_ID('dbo.stock_transactions', 'U') IS NOT NULL
    DROP TABLE dbo.stock_transactions;

CREATE TABLE stock_transactions (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    tx_code NVARCHAR(30) NOT NULL DEFAULT '',
    type       NVARCHAR(10)  NOT NULL CHECK (type IN ('IMPORT', 'EXPORT')),
    note       NVARCHAR(500) NOT NULL DEFAULT '',
    created_at DATETIME2     NOT NULL DEFAULT GETDATE()
);

CREATE TABLE stock_transaction_items (
    id             BIGINT        IDENTITY(1,1) PRIMARY KEY,
    transaction_id BIGINT        NOT NULL REFERENCES stock_transactions(id) ON DELETE CASCADE,
    product_id     BIGINT        NOT NULL REFERENCES products(id),
    quantity       INT           NOT NULL CHECK (quantity > 0),
    unit_price     DECIMAL(18,2) NOT NULL DEFAULT 0
);
