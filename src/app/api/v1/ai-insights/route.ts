import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';

const InsightSchema = z.object({
  material: z.string().min(1).max(100),
  process: z.string().min(1).max(100),
  finish: z.string().min(1).max(100),
  tolerance: z.string().min(1).max(100),
  complexity: z.string().min(1).max(100),
  quantity: z.number().min(1).max(100000),
  city: z.string().min(1).max(50),
  dimensions: z.object({
    l: z.number().min(0.1).max(5000),
    w: z.number().min(0.1).max(5000),
    h: z.number().min(0.1).max(5000),
  }),
  estimate: z.object({
    low: z.number().min(0),
    high: z.number().min(0),
  }),
});

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (Limit to 5 requests per minute per IP)
    const ip = getClientIdentifier(request.headers);
    const limiter = await rateLimit(`ai-insights:${ip}`, 5, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // Spend ceiling: per-IP limits don't bound a distributed caller, this does.
    const dailyCap = Number.parseInt(process.env.AI_INSIGHTS_DAILY_CAP ?? '1000', 10) || 1000;
    const budget = await rateLimit('ai-insights:global', dailyCap, 24 * 60 * 60 * 1000);
    if (!budget.success) {
      return rateLimitResponse(budget.reset);
    }

    // 2. Input Validation & Sanitization
    const body = await request.json();
    const result_v = InsightSchema.safeParse(body);

    if (!result_v.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: result_v.error.format() },
        { status: 400 }
      );
    }

    const {
      material,
      process: manufacturingProcess,
      finish,
      tolerance,
      complexity,
      quantity,
      city,
      dimensions,
      estimate,
    } = result_v.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `You are MechHub's manufacturing expert AI for India. A customer wants:
Material: ${material}, Process: ${manufacturingProcess}, Finish: ${finish}
Tolerance: ${tolerance}, Complexity: ${complexity}, Quantity: ${quantity} pcs
City: ${city}, Dimensions: ${dimensions.l}×${dimensions.w}×${dimensions.h}mm
Estimated price: ₹${estimate.low}–₹${estimate.high}

Give exactly 3 short, India-specific manufacturing insights:
1. A cost-saving tip specific to Indian market/material/process
2. A DFM (design for manufacturing) tip
3. A vendor selection tip for their city/region

Return ONLY a JSON array: [{"title": "...", "tip": "..."}]
No preamble, no markdown, just the JSON array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Attempt to parse JSON response. The model might return it wrapped in markdown blocks
    let jsonArray = [];
    try {
      const cleanText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      jsonArray = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', parseError, responseText);
      throw new Error('Invalid JSON from Gemini');
    }

    // Ensure we have 3 insights
    if (!Array.isArray(jsonArray) || jsonArray.length < 3) {
      throw new Error('Gemini returned invalid insight format');
    }

    return NextResponse.json({ insights: jsonArray.slice(0, 3) });
  } catch (error) {
    console.error('AI Insights Error:', error);
    // Return standard 500 so the client falls back to static
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
