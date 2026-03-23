-- Drop dependent table first
IF OBJECT_ID('dbo.order_items', 'U') IS NOT NULL
    DROP TABLE dbo.order_items;

IF OBJECT_ID('dbo.orders', 'U') IS NOT NULL
    DROP TABLE dbo.orders;

CREATE TABLE orders (
    id              BIGINT         IDENTITY(1,1) PRIMARY KEY,
    order_code      NVARCHAR(50)   NOT NULL UNIQUE,
    customer_name   NVARCHAR(200)  NOT NULL,
    customer_phone  NVARCHAR(20)   NOT NULL,
    status          NVARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','PACKING','DELIVERING','COMPLETED','CANCELLED')),
    note            NVARCHAR(500)  NOT NULL DEFAULT '',
    total_amount    DECIMAL(18,2)  NOT NULL DEFAULT 0,
    created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2      NOT NULL DEFAULT GETDATE()
);

CREATE TABLE order_items (
    id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
    order_id     BIGINT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   BIGINT        NOT NULL,
    product_name NVARCHAR(200) NOT NULL,
    quantity     INT           NOT NULL CHECK (quantity > 0),
    unit_price   DECIMAL(18,2) NOT NULL DEFAULT 0
);
