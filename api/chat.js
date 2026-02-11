export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY missing.");
    }

    const { messages = [], context = "" } = req.body;

    if (!Array.isArray(messages)) {
      throw new Error("Invalid messages format.");
    }

    const systemPrompt = `
You are MERCHO, a board-level strategic finance advisor.

CRITICAL FORMATTING RULES:
- Do NOT use Markdown.
- Do NOT use symbols like: #, *, **, ###.
- Do NOT use LaTeX.
- Do NOT use \\text{}, \\[, \\], or any math formatting.
- Do NOT use code blocks.
- Return ONLY plain UTF-8 text.
- No decorative formatting.
- No titles.
- No emojis.

STYLE RULES:
- Write short executive bullet points using "-" only.
- Maximum 5 bullet points.
- Each bullet = Insight + business impact + recommended action.
- Keep tone formal and strategic.
- No step-by-step math explanation unless explicitly requested.

DATA RULES:
- Use only provided context.
- No hallucination.
- If information is missing, state limitation clearly.

Business Context Snapshot:
${context}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://finnace-app-tracker-v1.vercel.app/",
        "X-Title": "MERCHO Strategic Advisor"
      },
      body: JSON.stringify({
        model: "arcee-ai/trinity-large-preview:free",
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    const rawText = await response.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("Invalid JSON returned from OpenRouter: " + rawText);
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenRouter request failed.");
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid AI response structure.");
    }

    return res.status(200).json({
      choices: [
        {
          message: {
            content: data.choices[0].message.content
          }
        }
      ]
    });

  } catch (error) {
    console.error("MERCHO API ERROR:", error.message);

    return res.status(200).json({
      choices: [
        {
          message: {
            content:
              "Le conseiller stratégique est temporairement indisponible. Vérifiez la configuration OpenRouter."
          }
        }
      ]
    });
  }
}
