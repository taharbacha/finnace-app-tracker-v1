-- 1. Optional: Delete all existing Facture REAL documents if you want a complete wipe of test data
-- Uncomment the following line if you want to delete them:
-- DELETE FROM documents WHERE type = 'facture_real';

-- 2. Reset the sequence counter to start at 1 (so the next insert will be FR0000001)
ALTER SEQUENCE IF EXISTS document_ref_seq_real RESTART WITH 1;
