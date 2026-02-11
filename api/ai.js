export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed. Please use POST.` });
  }

  try {
    const { messages } = req.body;

    const systemPrompt = "You are the Merch By DZ Assistant, a professional AI specialized in helping with e-commerce operations, marketing strategies, and business optimization. You are helpful, concise, and professional.";

    // Prepare messages with system prompt
    const formattedMessages = [
      { role: 'user', content: systemPrompt },
      { role: 'assistant', content: 'Hello! I am your Merch By DZ Assistant. How can I help you today?' },
      ...messages
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
        model: 'google/gemma-3-27b-it:free',
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenRouter API request failed');
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Gemini API Proxy Error:", error);
    return res.status(500).json({ 
      error: 'Failed to process AI request',
      details: error.message 
    });
  }
}
