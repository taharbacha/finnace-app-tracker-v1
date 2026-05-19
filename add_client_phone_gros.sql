-- Migration to add client_phone to commandes_gros table
ALTER TABLE commandes_gros ADD COLUMN IF NOT EXISTS client_phone TEXT;
