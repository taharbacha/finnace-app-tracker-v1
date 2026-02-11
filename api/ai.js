export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed. Please use POST.` });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const systemPrompt = "You are the Merch By DZ Assistant, a professional AI specialized in helping with e-commerce operations, marketing strategies, and business optimization. You are helpful, concise, and professional.";

    // Format messages for OpenRouter
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

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
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Verify response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response structure:", data);
      throw new Error('Invalid response from AI service');
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("AI Assistant Error:", error);
    return res.status(500).json({ 
      error: 'Failed to process AI request',
      details: error.message 
    });
  }
}
