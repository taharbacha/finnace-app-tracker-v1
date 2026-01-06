
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI Service configuration missing.' });
  }

  try {
    const { messages, context } = req.body;

    const systemPrompt = {
      role: "system",
      content: `You are the Merch By DZ Business Intelligence Assistant. 
      Your role is to analyze provided business data and give strategic advice.
      
      RULES:
      1. You are READ-ONLY. You cannot change data, only suggest improvements.
      2. Use the "Context" provided to give accurate answers.
      3. If asked to perform an action, explain that you are a strategic advisor and suggest how the user can do it manually in the relevant section.
      4. Be concise, professional, and data-driven.
      
      Current Business Context:
      ${context}`
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://merch-by-dz.vercel.app",
        "X-Title": "Merch By DZ Advisor"
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2:free",
        messages: [systemPrompt, ...messages]
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reach AI service.' });
  }
}
