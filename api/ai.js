
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed. Please use POST.` });
  }

  // Fix: Initializing GoogleGenAI with process.env.API_KEY exclusively as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const { messages } = req.body;

    // Fix: Using gemini-3-pro-preview for professional business optimization tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: "You are the Merch By DZ Assistant, a professional AI specialized in helping with e-commerce operations, marketing strategies, and business optimization. You are helpful, concise, and professional."
      }
    });

    // Fix: Extracting generated text using the .text property
    return res.status(200).json({
      choices: [{
        message: {
          content: response.text
        }
      }]
    });
  } catch (error) {
    console.error("Gemini API Proxy Error:", error);
    return res.status(500).json({ 
      error: 'Failed to process AI request',
      details: error.message 
    });
  }
}
