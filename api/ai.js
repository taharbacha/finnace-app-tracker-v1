export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed. Please use POST.` });
  }

  try {
    const { messages } = req.body;

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

    const systemPrompt = "You are the Merch By DZ Assistant, a professional AI specialized in helping with e-commerce operations, marketing strategies, and business optimization. You are helpful, concise, and professional.";

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

    console.log('Calling OpenRouter API with meta-llama/llama-3.2-3b-instruct:free');

    // Call OpenRouter API with a working free model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finnace-app-tracker-v1.vercel.app/',
        'X-Title': 'Merch By DZ Assistant'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: formattedMessages,
        temperature: 0.7,
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
            content: `Erreur OpenRouter (${response.status}): Le service AI est temporairement indisponible. Veuillez réessayer.`
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
    console.error("Merch By DZ Assistant Error:", error.message);
    
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
