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
        error: 'Invalid request',
        details: 'Messages array is required and must not be empty'
      });
    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set");
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'API key not configured'
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

    console.log('Calling OpenRouter API...');

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finnace-app-tracker-v1.vercel.app/',
        'X-Title': 'Merch By DZ Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      
      return res.status(response.status).json({ 
        error: 'AI service error',
        details: `API returned ${response.status}`,
        message: errorText
      });
    }

    const data = await response.json();
    console.log('OpenRouter Response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", data);
      
      return res.status(500).json({ 
        error: 'Invalid AI response',
        details: 'Unexpected response format from AI service'
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
    console.error("Merch By DZ Assistant Error:", error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
