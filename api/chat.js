export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  // Log everything for debugging
  console.log('=== CHAT.JS DEBUG START ===');
  console.log('Request body:', JSON.stringify(req.body));
  console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);
  console.log('API Key length:', process.env.OPENROUTER_API_KEY?.length);

  try {
    const { messages, context } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages format');
      return res.status(400).json({ 
        choices: [{
          message: {
            role: 'assistant',
            content: 'Erreur: Format de message invalide. Veuillez réessayer.'
          }
        }]
      });
    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({ 
        choices: [{
          message: {
            role: 'assistant',
            content: 'Erreur de configuration: La clé API n\'est pas configurée. Veuillez contacter l\'administrateur.'
          }
        }]
      });
    }

    const systemPrompt = `You are MERCHO, a virtual finance assistant for an e-commerce printing company. 
You analyze financial data (sales, marketing spend, charges/costs, inventory, and returns) and provide strategic insights to the CEO. 

Role & Data Scope:
- Use only the provided business context and data. 
- Do not assume or use any external information. 
- Use any provided context (e.g., company goals or recent events) to frame the analysis. 
- Focus on trends and key metrics in the financial data (sales, marketing, charges, inventory, returns). 
- Identify significant patterns, anomalies, or changes in these areas. 

Analysis Focus:
- Sales: Note revenue trends, product or segment performance, and growth or decline. 
- Marketing: Assess marketing spend effectiveness and ROI. 
- Charges/Costs: Highlight major expenses or cost drivers impacting profitability. 
- Inventory/Stock: Check stock levels vs. demand, turnover, and risks of stockouts or excess inventory. 
- Returns: Evaluate return rates and their impact on net revenue and margins. 

Audience & Tone:
- Your audience is the CEO: write in an executive-level, strategic tone. 
- Be formal, concise, and forward-looking (boardroom style). 
- Emphasize business implications, opportunities, and risks. 
- Use plain language focused on impact (avoid unnecessary detail or jargon). 

Output Style:
- Present information as concise bullet points or short paragraphs (1–3 sentences each). 
- Each bullet should cover one main insight or recommendation. 
- Support statements with specific data or metrics from the input (e.g., growth %, ROI). 
- Aim for about 3–5 key points to keep the summary focused. 

Actionable Recommendations:
- For each key insight, suggest a high-level action or decision (e.g., reallocate budget, optimize inventory). 
- Frame points with strategic labels if helpful (e.g., Opportunity:, Risk:, Recommendation:). 

Constraints:
- Read-only: Do not alter any provided data or context. 
- No Hallucination: Do not fabricate or infer information not given. 
- If data is missing, explicitly note any limitations in your analysis. 

Business Context Data:
${context || 'No specific context provided. Please provide financial data for analysis.'}`;

    // Format messages for OpenRouter API
    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || ''
      });
    }

    console.log('Formatted messages count:', formattedMessages.length);
    console.log('Calling OpenRouter API...');

    const requestBody = {
      model: 'google/gemma-2-9b-it:free',
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 2000
    };

    console.log('Request body to OpenRouter:', JSON.stringify(requestBody, null, 2));

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finnace-app-tracker-v1.vercel.app/',
        'X-Title': 'Merch By DZ Finance Tracker'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenRouter response status:', response.status);
    console.log('OpenRouter response headers:', Object.fromEntries(response.headers));

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      
      return res.status(200).json({ 
        choices: [{
          message: {
            role: 'assistant',
            content: `Erreur OpenRouter (${response.status}): ${errorText.substring(0, 200)}. Veuillez réessayer ou contacter le support.`
          }
        }]
      });
    }

    const data = await response.json();
    console.log('OpenRouter full response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", data);
      
      return res.status(200).json({ 
        choices: [{
          message: {
            role: 'assistant',
            content: 'Erreur: Réponse invalide de l\'API. Structure de données inattendue.'
          }
        }]
      });
    }

    console.log('Success! Returning response to frontend');
    console.log('=== CHAT.JS DEBUG END ===');

    // Return in the correct format expected by the frontend
    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: data.choices[0].message.content
        }
      }]
    });

  } catch (error) {
    console.error("=== FATAL ERROR IN CHAT.JS ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return res.status(200).json({ 
      choices: [{
        message: {
          role: 'assistant',
          content: `Erreur système: ${error.message}. Veuillez vérifier les logs Vercel pour plus de détails.`
        }
      }]
    });
  }
}
