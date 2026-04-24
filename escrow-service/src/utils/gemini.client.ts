import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { logger } from './logger';

function stripMarkdownJson(text: string): string {
  text = text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?\n/i, '').replace(/\n```$/, '');
  }
  return text.trim();
}

export async function generateJson(prompt: string, system: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in environment');
  }

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemWithJsonDirective = `${system}\n\nYou MUST respond with valid JSON only.`;
  const fullPrompt = `${systemWithJsonDirective}\n\n${prompt}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      const cleaned = stripMarkdownJson(responseText);

      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        throw new Error(`Failed to parse Gemini JSON response: ${(parseError as Error).message}\nResponse was: ${cleaned}`);
      }
    } catch (error) {
      const msg = (error as Error).message || '';
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('quota exceeded') || msg.toLowerCase().includes('resource exhausted');

      if (isRateLimit && attempt < maxRetries - 1) {
        logger.info(`Gemini rate limit hit, waiting 36s before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 36000));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Gemini API failed after max retries');
}

export async function analyzeDesignImage(
  imageUrl: string,
  requirements: string[]
): Promise<{ pass: boolean; score: number; evidence: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  let imageData: string;
  let mimeType: string;

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    imageData = Buffer.from(response.data as ArrayBuffer).toString('base64');
    mimeType = (response.headers['content-type'] as string) || 'image/png';
  } catch (err) {
    throw new Error(`Failed to fetch design image: ${(err as Error).message}`);
  }

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a professional UI/UX design reviewer. Analyze this design image against the following requirements:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Respond ONLY with valid JSON (no markdown, no explanation):
{"pass": boolean, "score": number_0_to_100, "evidence": "brief_explanation_of_what_matches_or_is_missing"}`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType, data: imageData } }
  ]);

  const text = stripMarkdownJson(result.response.text());
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse Gemini vision response: ${text}`);
  }
}
