
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const { messages } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Missing OPENROUTER_API_KEY");
      return res.status(500).json({ error: 'AI configuration error.' });
    }

    const systemPrompt = `You are MERCHO, a virtual executive finance assistant for an e-commerce printing company. Use a formal, boardroom-level tone. Focus on ROI, profitability, and operational efficiency.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenRouter API failure");
    }

    const data = await response.json();
    
    // Maintain strict compatibility with frontend expectations
    return res.status(200).json({
      choices: [
        {
          message: {
            content: data.choices?.[0]?.message?.content || "Service unavailable."
          }
        }
      ]
    });

  } catch (error) {
    console.error("AI Assistant API Error:", error.message);
    return res.status(500).json({ error: 'AI routing failure.' });
  }
}
