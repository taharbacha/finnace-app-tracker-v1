CREATE TABLE IF NOT EXISTS bank_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    somme NUMERIC NOT NULL,
    tva NUMERIC DEFAULT 0,
    description TEXT
);
