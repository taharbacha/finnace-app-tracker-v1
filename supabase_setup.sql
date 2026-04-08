
-- Create Document Type Enum
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('facture', 'proforma', 'bon_livraison');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Document Status Enum
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('draft', 'validated', 'paid', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    type document_type NOT NULL,
    client_nom TEXT,
    client_adresse TEXT,
    client_rc TEXT,
    client_nif TEXT,
    client_nis TEXT,
    client_ai TEXT,
    client_telephone TEXT,
    date DATE DEFAULT CURRENT_DATE,
    status document_status DEFAULT 'draft',
    total_ht NUMERIC DEFAULT 0,
    tva_percent NUMERIC DEFAULT 19,
    tva_amount NUMERIC DEFAULT 0,
    shipping NUMERIC DEFAULT 0,
    timbre NUMERIC DEFAULT 0,
    versement NUMERIC DEFAULT 0,
    total_ttc NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Document Items Table
CREATE TABLE IF NOT EXISTS document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    article TEXT NOT NULL,
    quantite NUMERIC NOT NULL DEFAULT 1,
    prix_unitaire NUMERIC NOT NULL DEFAULT 0,
    total_ligne NUMERIC GENERATED ALWAYS AS (quantite * prix_unitaire) STORED
);

-- Function to update document totals
CREATE OR REPLACE FUNCTION update_document_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE documents
    SET 
        total_ht = (SELECT COALESCE(SUM(total_ligne), 0) FROM document_items WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)),
        tva_amount = (SELECT COALESCE(SUM(total_ligne), 0) FROM document_items WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)) * (tva_percent / 100),
        total_ttc = (SELECT COALESCE(SUM(total_ligne), 0) FROM document_items WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)) * (1 + tva_percent / 100) + shipping + timbre - versement,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.document_id, OLD.document_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on document_items
DROP TRIGGER IF EXISTS trigger_update_document_totals_on_item_change ON document_items;
CREATE TRIGGER trigger_update_document_totals_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON document_items
FOR EACH ROW EXECUTE FUNCTION update_document_totals();

-- Function to update document totals when document fields change
CREATE OR REPLACE FUNCTION update_document_totals_on_doc_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tva_amount := NEW.total_ht * (NEW.tva_percent / 100);
    NEW.total_ttc := NEW.total_ht + NEW.tva_amount + NEW.shipping + NEW.timbre - NEW.versement;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on documents
DROP TRIGGER IF EXISTS trigger_update_document_totals_on_doc_change ON documents;
CREATE TRIGGER trigger_update_document_totals_on_doc_change
BEFORE UPDATE OF tva_percent, shipping, timbre, versement ON documents
FOR EACH ROW EXECUTE FUNCTION update_document_totals_on_doc_change();

-- Auto-numbering logic
CREATE SEQUENCE IF NOT EXISTS document_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_document_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        NEW.reference := 'F' || LPAD(nextval('document_ref_seq')::text, 7, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_document_reference ON documents;
CREATE TRIGGER trigger_generate_document_reference
BEFORE INSERT ON documents
FOR EACH ROW EXECUTE FUNCTION generate_document_reference();
