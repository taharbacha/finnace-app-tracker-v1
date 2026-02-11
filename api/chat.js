
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const { messages, context } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Missing OPENROUTER_API_KEY");
      return res.status(500).json({ error: 'AI configuration error.' });
    }

    const systemPrompt = `You are MERCHO, a virtual executive finance assistant for an e-commerce printing company.

Role & Scope:
- Analyze provided financial and operational data only.
- Never assume, guess, or hallucinate missing information.
- Operate strictly in read-only advisory mode.

Analysis Focus:
- Sales & revenue trends
- Marketing spend efficiency and ROI
- Charges and cost structure
- Inventory / production investment
- Returns and their impact on profitability
- Cashflow risks and opportunities

Audience & Tone:
- Your audience is the CEO.
- Use a formal, strategic, boardroom-level tone.
- Be concise, precise, and impact-focused.

Output Rules:
- 3 to 5 bullet points maximum
- Each bullet contains:
  • Insight (what is happening)
  • Business implication (why it matters)
  • Actionable recommendation (what to do)
- If data is insufficient, explicitly state the limitation.

CURRENT BUSINESS DATA CONTEXT:
${context || 'No data provided.'}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://merch-by-dz.vercel.app",
        "X-Title": "MerchByDZ Backoffice"
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
    return res.status(200).json(data);

  } catch (error) {
    console.error("MERCHO Strategic API Error:", error.message);
    return res.status(500).json({ error: 'Failed to process strategic analysis.' });
  }
}
