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

    const { messages = [] } = req.body;

    if (!Array.isArray(messages)) {
      throw new Error("Invalid messages format.");
    }

    const systemPrompt = `
You are the Merch By DZ Assistant.
You help with e-commerce operations, logistics, marketing strategy, and business optimization.
Be concise, practical, and professional.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://finnace-app-tracker-v1.vercel.app/",
        "X-Title": "Merch By DZ Assistant"
      },
      body: JSON.stringify({
        model: "arcee-ai/trinity-large-preview:free",
        temperature: 0.7,
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
    console.error("Assistant API ERROR:", error.message);

    return res.status(200).json({
      choices: [
        {
          message: {
            content:
              "L’assistant est temporairement indisponible. Vérifiez la configuration OpenRouter."
          }
        }
      ]
    });
  }
}
