
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed. Please use POST.` });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    const { messages } = req.body;

    // We include a system prompt here to give the AI context while maintaining isolation from the app's database
    const systemMessage = {
      role: "system",
      content: "You are the Merch By DZ Assistant, a professional AI specialized in helping with e-commerce operations, marketing strategies, and business optimization. You are helpful, concise, and professional. You do not have direct access to real-time financial data in this session, but you can provide expert advice on how to manage wholesale, retail, and marketing activities."
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://merch-by-dz.vercel.app",
        "X-Title": "Merch By DZ Assistant"
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2:free",
        messages: [systemMessage, ...(messages || [])]
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenRouter Error Response:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return res.status(500).json({ 
      error: 'Failed to process AI request',
      details: error.message 
    });
  }
}
