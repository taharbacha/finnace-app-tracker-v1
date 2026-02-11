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

  try {
    const { messages, context } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
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
            content: 'Erreur de configuration: La clé API n\'est pas configurée.'
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

    console.log('Calling OpenRouter API with google/gemma-3-27b-it:free');

    // Call OpenRouter API with a working free model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finnace-app-tracker-v1.vercel.app/',
        'X-Title': 'Merch By DZ Finance Tracker'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free',
        messages: formattedMessages,
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    console.log('OpenRouter response status:', response.status);

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      
      return res.status(200).json({ 
        choices: [{
          message: {
            role: 'assistant',
            content: `Erreur OpenRouter (${response.status}): Le service AI est temporairement indisponible. Veuillez réessayer dans quelques instants.`
          }
        }]
      });
    }

    const data = await response.json();
    console.log('OpenRouter response received successfully');
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", JSON.stringify(data));
      
      return res.status(200).json({ 
        choices: [{
          message: {
            role: 'assistant',
            content: 'Erreur: Réponse invalide de l\'API. Veuillez réessayer.'
          }
        }]
      });
    }

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
    console.error("MERCHO Advisor Error:", error.message);
    
    return res.status(200).json({ 
      choices: [{
        message: {
          role: 'assistant',
          content: `Erreur système: ${error.message}. Veuillez réessayer.`
        }
      }]
    });
  }
}
