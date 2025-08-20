-- Database initialization script for Hyrlqi gambling platform

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hyrlqi_gambling;

-- Use the database
\c hyrlqi_gambling;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE game_type AS ENUM ('PLINKO', 'MINES', 'CRASH');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'BONUS', 'REFUND');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 1000.00 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create game_history table
CREATE TABLE IF NOT EXISTS game_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type game_type NOT NULL,
    bet_amount DECIMAL(15,2) NOT NULL,
    payout DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    multiplier FLOAT DEFAULT 0.0 NOT NULL,
    is_win BOOLEAN DEFAULT false NOT NULL,
    game_data JSONB NOT NULL,
    seed TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    game_history_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create game_settings table
CREATE TABLE IF NOT EXISTS game_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    game_type game_type UNIQUE NOT NULL,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create system_stats table
CREATE TABLE IF NOT EXISTS system_stats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    total_users INTEGER DEFAULT 0 NOT NULL,
    total_games_played INTEGER DEFAULT 0 NOT NULL,
    total_volume DECIMAL(20,2) DEFAULT 0.00 NOT NULL,
    total_payout DECIMAL(20,2) DEFAULT 0.00 NOT NULL,
    house_profit DECIMAL(20,2) DEFAULT 0.00 NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history(game_type);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at);
CREATE INDEX IF NOT EXISTS idx_game_history_is_win ON game_history(is_win);
CREATE INDEX IF NOT EXISTS idx_game_history_payout ON game_history(payout);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_settings_updated_at BEFORE UPDATE ON game_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default game settings
INSERT INTO game_settings (game_type, settings, is_active) VALUES
('PLINKO', '{
    "house_edge": 0.01,
    "min_bet": 0.01,
    "max_bet": 10000,
    "available_rows": [8, 12, 16],
    "risk_levels": ["low", "medium", "high"]
}', true),
('MINES', '{
    "house_edge": 0.01,
    "min_bet": 0.01,
    "max_bet": 10000,
    "min_grid_size": 9,
    "max_grid_size": 25,
    "min_mines": 1,
    "max_mines": 24
}', true),
('CRASH', '{
    "house_edge": 0.01,
    "min_bet": 0.01,
    "max_bet": 10000,
    "min_multiplier": 1.00,
    "max_multiplier": 1000000,
    "game_duration_ms": 20000
}', true)
ON CONFLICT (game_type) DO NOTHING;

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update daily stats
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    user_count INTEGER;
    games_count INTEGER;
    total_volume DECIMAL(20,2);
    total_payout DECIMAL(20,2);
    house_profit DECIMAL(20,2);
BEGIN
    -- Calculate stats for today
    SELECT COUNT(*) INTO user_count FROM users WHERE DATE(created_at) = current_date;
    
    SELECT COUNT(*), COALESCE(SUM(bet_amount), 0), COALESCE(SUM(payout), 0)
    INTO games_count, total_volume, total_payout
    FROM game_history 
    WHERE DATE(created_at) = current_date;
    
    house_profit := total_volume - total_payout;
    
    -- Insert or update daily stats
    INSERT INTO system_stats (total_users, total_games_played, total_volume, total_payout, house_profit, date)
    VALUES (user_count, games_count, total_volume, total_payout, house_profit, current_date)
    ON CONFLICT (date) 
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        total_games_played = EXCLUDED.total_games_played,
        total_volume = EXCLUDED.total_volume,
        total_payout = EXCLUDED.total_payout,
        house_profit = EXCLUDED.house_profit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hyrlqi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hyrlqi_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hyrlqi_user;

-- Create initial system stats entry
INSERT INTO system_stats (date) VALUES (CURRENT_DATE) ON CONFLICT (date) DO NOTHING;
