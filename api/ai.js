
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const { messages } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemPrompt = `You are MERCHO, a virtual executive finance assistant for an e-commerce printing company. Use a formal, boardroom-level tone. Focus on ROI, profitability, and operational efficiency.`;

    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3
      }
    });

    return res.status(200).json({
      choices: [
        {
          message: {
            content: response.text || "Service unavailable."
          }
        }
      ]
    });

  } catch (error) {
    console.error("AI routing failure:", error);
    return res.status(500).json({ error: 'AI routing failure.' });
  }
}
