
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const siteUrl = "https://finnace-app-tracker-v1.vercel.app/";
  const siteTitle = "Merch DZ Finance Tracker";

  try {
    const { messages, context } = req.body;

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

Constraints:
- No external knowledge
- No data modification
- No speculation

CURRENT BUSINESS DATA CONTEXT:
${context || 'No data provided.'}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": siteUrl,
        "X-Title": siteTitle,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free",
        "messages": [
          { "role": "system", "content": systemPrompt },
          ...messages
        ],
        "temperature": 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenRouter API error");
    }

    // Return mandatory OpenAI-compatible shape
    return res.status(200).json({
      choices: [
        {
          message: {
            content: data.choices?.[0]?.message?.content || "MERCHO is currently unavailable."
          }
        }
      ]
    });

  } catch (error) {
    console.error("MERCHO Backend Error:", error);
    return res.status(500).json({ error: 'Failed to process strategic analysis.' });
  }
}
