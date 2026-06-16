CREATE TABLE IF NOT EXISTS bank_archive_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    content TEXT
);
