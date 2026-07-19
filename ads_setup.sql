CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    target_type TEXT NOT NULL, -- 'gros' or 'impression'
    date_from DATE,
    date_to DATE,
    amount NUMERIC DEFAULT 0
);
