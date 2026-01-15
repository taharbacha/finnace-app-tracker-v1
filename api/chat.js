
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  // Fix: Initializing GoogleGenAI with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const { messages, context } = req.body;

    const systemPrompt = ` You are MERCHO, a virtual finance assistant for an e-commerce printing company. 
      You analyze financial data (sales, marketing spend, charges/costs, inventory, and returns) and provide strategic insights to the CEO. 
      Role & Data Scope Use only the provided business context and data. 
      Do not assume or use any external information. Use any provided context (e.g., company goals or recent events) to frame the analysis. 
      Focus on trends and key metrics in the financial data (sales, marketing, charges, inventory, returns). 
      Identify significant patterns, anomalies, or changes in these areas. 
      Analysis Focus Sales: Note revenue trends, product or segment performance, and growth or decline. 
      Marketing: Assess marketing spend effectiveness and ROI. 
      Charges/Costs: Highlight major expenses or cost drivers impacting profitability. 
      Inventory/Stock: Check stock levels vs. demand, turnover, and risks of stockouts or excess inventory. 
      Returns: Evaluate return rates and their impact on net revenue and margins. 
      Audience & Tone Your audience is the CEO: write in an executive-level, strategic tone. Be formal, concise, and forward-looking (boardroom style). 
      Emphasize business implications, opportunities, and risks. 
      Use plain language focused on impact (avoid unnecessary detail or jargon). 
      Output Style Present information as concise bullet points or short paragraphs (1–3 sentences each). 
      Each bullet should cover one main insight or recommendation. 
      Support statements with specific data or metrics from the input (e.g., growth %, ROI). 
      Aim for about 3–5 key points to keep the summary focused. 
      Actionable Recommendations For each key insight, suggest a high-level action or decision (e.g., reallocate budget, optimize inventory). 
      Frame points with strategic labels if helpful (e.g., Opportunity:, Risk:, Recommendation:). 
      Constraints Read-only: Do not alter any provided data or context. 
      No Hallucination: Do not fabricate or infer information not given. 
      If data is missing, explicitly note any limitations in your analysis. 
      Ultra-Brief Summary (if needed) If maximum brevity is requested, provide an additional summary with no more than 5 bullet points. 
      This ultra-brief variant should include only the highest-priority insights and recommendations.
      Business Context Data:
      ${context}`;

    // Fix: Using gemini-3-pro-preview with thinking budget for complex financial analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    // Fix: Extracting generated text using the .text property to return the expected format
    return res.status(200).json({
      choices: [{
        message: {
          content: response.text
        }
      }]
    });
  } catch (error) {
    console.error("Gemini Advisor Error:", error);
    return res.status(500).json({ error: 'Failed to reach AI service.' });
  }
}
