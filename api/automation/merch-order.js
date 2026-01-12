
import { createClient } from '@supabase/supabase-js';

/**
 * ARCHITECTURE SPECIFICATION: Automation API Gateway
 * Purpose: Secure CREATE-ONLY endpoint for external systems (n8n).
 * Financial Safety: Hardcodes status to 'en_livraison' which has 0 impact on accounting.
 */

export default async function handler(req, res) {
  // 1. Strict Method Check
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  // 2. Environment Variable Validation
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const automationToken = process.env.AUTOMATION_MERCH_TOKEN;

  if (!supabaseUrl || !supabaseServiceKey || !automationToken) {
    console.error("Critical: Missing Server-Side Environment Variables");
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // 3. Authorization Check
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${automationToken}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing token.' });
  }

  try {
    const { reference, client_name, produit, prix_achat, prix_vente } = req.body;

    // 4. Payload Validation
    if (!reference || !client_name || !produit) {
      return res.status(400).json({ error: 'Missing required fields: reference, client_name, produit.' });
    }

    // 5. Data Sanitization
    const sanitizedPrixAchat = Number(prix_achat) || 0;
    const sanitizedPrixVente = Number(prix_vente) || 0;

    // 6. Hardcoded Neutrality (Financial Safety)
    // We force the status and creation date regardless of what the automation sends.
    const newOrder = {
      reference: String(reference),
      client_name: String(client_name),
      produit: String(produit),
      prix_achat: sanitizedPrixAchat,
      prix_vente: sanitizedPrixVente,
      status: 'en_livraison', // Hardcoded: Financial impact = 0
      created_at: new Date().toISOString()
    };

    // 7. Supabase Insert (Service Role Bypass)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('commandes_merch')
      .insert([newOrder])
      .select('id, reference, status')
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: 'Failed to create order in database.' });
    }

    // 8. Success Response
    return res.status(201).json({
      success: true,
      id: data.id,
      reference: data.reference,
      status: data.status
    });

  } catch (err) {
    console.error("Internal Server Error:", err);
    return res.status(500).json({ error: 'Internal system error.' });
  }
}
