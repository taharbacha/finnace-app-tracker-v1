-- Migration to add Facture REAL support to the database

-- 1. Add the new type to the enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'facture_real';

-- 2. Create the sequence specifically for FR factures
CREATE SEQUENCE IF NOT EXISTS document_ref_seq_real START 1;

-- 3. Replace the reference generation trigger to correctly prefix
CREATE OR REPLACE FUNCTION generate_document_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        IF NEW.type = 'facture_real' THEN
            NEW.reference := 'FR' || LPAD(nextval('document_ref_seq_real')::text, 7, '0');
        ELSIF NEW.type = 'proforma' THEN
            NEW.reference := 'P' || LPAD(nextval('document_ref_seq')::text, 7, '0');
        ELSIF NEW.type = 'bon_livraison' THEN
            NEW.reference := 'B' || LPAD(nextval('document_ref_seq')::text, 7, '0');
        ELSE
            NEW.reference := 'F' || LPAD(nextval('document_ref_seq')::text, 7, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;