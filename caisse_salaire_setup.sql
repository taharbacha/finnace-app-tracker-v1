-- Module Caisse
CREATE TABLE IF NOT EXISTS caisse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    somme NUMERIC NOT NULL,
    description TEXT NOT NULL,
    agent TEXT NOT NULL
);

-- Module Salaire (Employés)
CREATE TABLE IF NOT EXISTS employes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nom TEXT NOT NULL,
    salaire_base NUMERIC NOT NULL DEFAULT 0
);

-- Module Salaire (Paiements/Avances)
CREATE TABLE IF NOT EXISTS salaire_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    employe_id UUID REFERENCES employes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL,
    description TEXT
);
