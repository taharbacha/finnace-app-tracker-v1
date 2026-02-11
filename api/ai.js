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

  // Log everything for debugging
  console.log('=== AI.JS DEBUG START ===');
  console.log('Request body:', JSON.stringify(req.body));
  console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);

  try {
    const { messages } = req.body;

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

    console.log('Formatted messages count:', formattedMessages.length);
    console.log('Calling OpenRouter API...');

    const requestBody = {
      model: 'google/gemma-2-9b-it:free',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000
    };

    console.log('Request to OpenRouter:', JSON.stringify(requestBody, null, 2));

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finnace-app-tracker-v1.vercel.app/',
        'X-Title': 'Merch By DZ Assistant'
      },
      body: JSON.stringify(requestBody)
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
            content: `Erreur OpenRouter (${response.status}): Veuillez réessayer.`
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
            content: 'Erreur: Réponse invalide de l\'API.'
          }
        }]
      });
    }

    console.log('Success! Returning response');
    console.log('=== AI.JS DEBUG END ===');

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
    console.error("=== FATAL ERROR IN AI.JS ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(200).json({ 
      choices: [{
        message: {
          role: 'assistant',
          content: `Erreur système: ${error.message}`
        }
      }]
    });
  }
}
