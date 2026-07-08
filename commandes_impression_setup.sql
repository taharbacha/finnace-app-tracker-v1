CREATE TABLE IF NOT EXISTS commandes_impression (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ref TEXT,
    client_name TEXT,
    phone_number TEXT,
    cout_article NUMERIC DEFAULT 0,
    cout_impression NUMERIC DEFAULT 0,
    prix_vente NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'en production',
    has_versement BOOLEAN DEFAULT false
);
