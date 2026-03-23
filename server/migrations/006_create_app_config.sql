-- app_config: key-value store for application settings
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_config' AND xtype='U')
CREATE TABLE app_config (
    config_key   NVARCHAR(100) PRIMARY KEY,
    config_value NVARCHAR(500) NOT NULL,
    description  NVARCHAR(300) NULL,
    updated_at   DATETIME2 DEFAULT GETDATE()
);

-- Seed default exchange rate: 1 USD = 25500 VND
IF NOT EXISTS (SELECT 1 FROM app_config WHERE config_key = 'usd_to_vnd_rate')
INSERT INTO app_config (config_key, config_value, description)
VALUES ('usd_to_vnd_rate', '25500', 'Exchange rate: 1 USD = ? VND');
