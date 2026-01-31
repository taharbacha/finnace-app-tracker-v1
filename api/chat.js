
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const { messages, context } = req.body;

    // Use Gemini 3 Pro for complex business strategic analysis as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    // Map messages to Gemini format (user/model)
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });

    const aiContent = response.text || "MERCHO is currently unavailable.";

    // Return mandatory OpenAI-compatible shape for the frontend
    return res.status(200).json({
      choices: [
        {
          message: {
            content: aiContent
          }
        }
      ]
    });

  } catch (error) {
    console.error("MERCHO Backend Error:", error);
    return res.status(500).json({ error: 'Failed to process strategic analysis.' });
  }
}
