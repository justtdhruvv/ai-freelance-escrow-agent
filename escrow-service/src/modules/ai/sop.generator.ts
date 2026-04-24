import { generateJson } from '../../utils/gemini.client';
import { logger } from '../../utils/logger';

export interface SOPCheck {
  type: string;
  description: string;
  params: Record<string, any>;
  verified_by: 'auto' | 'manual';
}

export interface SOPMilestone {
  title: string;
  deadline: string;
  payment_amount: number;
  checks: SOPCheck[];
}

export interface GeneratedSOP {
  content_html: string;
  milestones: SOPMilestone[];
  version?: number;
}

function buildSystemPrompt(): string {
  return `You are an expert Project Planning AI that converts client briefs into structured Standard Operating Procedures (SOPs).

You MUST output ONLY valid JSON.
Do not include markdown code fences (like \`\`\`json), no intro text, no explanation text. Just the raw JSON object.

The JSON MUST match exactly this structure:
{
  "content_html": "<string: a human-readable SOP formatted as HTML>",
  "milestones": [
    {
      "title": "<string>",
      "deadline": "<ISO date string>",
      "payment_amount": <number in USD cents>,
      "checks": [
        {
          "type": "<string>",
          "description": "<string>",
          "params": { "<key>": "<value or nested object>" },
          "verified_by": "<auto or manual>"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Each milestone should have a realistic payment_amount in USD cents (e.g., 50000 for $500).

2. For code projects, use "code_feature" check type instead of hardcoded file_exists!
   WRONG: { "type": "file_exists", "params": {"path": "src/main.py"} }
   RIGHT: { "type": "code_feature", "params": {"semantic_requirement": "Main entry point and app initialization"} }

3. Every check "type" MUST be from this exact fixed list:
   - http_endpoint (for API endpoints)
   - file_exists (for specific known files like README.md)
   - function_exists (for specific known functions)
   - code_feature (for semantic requirements - searches repo for matching implementation)
   - word_count (for content)
   - keyword_present (for content)
   - readability (for content)
   - design_visual (for visual analysis of submitted design screenshots using AI Vision)
   - manual (if NO auto check is possible)

If a requirement cannot map to one of these types, set type to "manual".

4. "verified_by" must ALWAYS be lowercase: ONLY "auto" or "manual". Never "Manual", "Auto", or anything else.

5. For "code_feature" checks:
   - params MUST include: "semantic_requirement": "clear description of what feature should exist"
   - The system will search the repo for matching files based on keywords
   - DO NOT specify file paths - let the system discover them!

6. For "http_endpoint" type checks, the "params" structure MUST be exactly:
   {
     "method": "GET|POST|PUT|DELETE",
     "endpoint": "/path/to/endpoint",
     "expected_status": 200,
     "expected_field": "fieldname or null"
   }

7. For "function_exists" type checks, use ONLY for well-known functions:
   {
     "path": "relative/file/path.py",
     "function_name": "function_name_here"
   }
   Use "code_feature" instead for searching general implementations!

8. For "design_visual" check type:
   - Use for visual design quality checks against design requirements
   - params MUST include: "requirements": ["list", "of", "design", "requirements"]
   - The system will ask the freelancer to submit a design image URL, then AI Vision analyzes it
   - Example: { "type": "design_visual", "params": { "requirements": ["color palette matches brand", "mobile responsive layout", "navigation is clearly visible"] }, "verified_by": "auto" }

DOMAIN-SPECIFIC REQUIREMENTS:
- For "code" domain: Use "code_feature" checks for semantic requirements, and only use "file_exists" for known critical files like "README.md" or "package.json".
- For "content" domain: Use word_count, keyword_present, readability checks.
- For "design" domain: Use "design_visual" checks for visual quality analysis using AI Vision.`;
}

function buildUserPrompt(briefText: string, domain: string, timelineDays: number): string {
  return `Please generate the SOP for the following client brief.

Domain: ${domain}
Timeline: ${timelineDays} days

Client Brief:
${briefText}`;
}

function validateSOPQuality(sop: any, domain: string): { valid: boolean; reason: string } {
  const milestones: any[] = sop.milestones || [];

  for (const milestone of milestones) {
    if (!milestone.checks || milestone.checks.length === 0) {
      return { valid: false, reason: `Milestone '${milestone.title || 'unknown'}' has no checks` };
    }
  }

  const totalPayment = milestones.reduce((sum: number, m: any) => sum + (m.payment_amount || 0), 0);
  if (totalPayment <= 0) {
    return { valid: false, reason: 'Total payment_amount must be greater than 0' };
  }

  const allChecks = milestones.flatMap((m: any) => m.checks || []);
  if (allChecks.length === 0) {
    return { valid: false, reason: 'No checks found across milestones' };
  }

  if (domain.toLowerCase() === 'code') {
    const autoTypes = new Set(['http_endpoint', 'file_exists', 'function_exists', 'code_feature']);
    const autoCount = allChecks.filter((c: any) => autoTypes.has(c.type)).length;
    const ratio = autoCount / allChecks.length;
    if (ratio < 0.4) {
      return { valid: false, reason: `Code project needs more auto-verifiable checks (has ${Math.round(ratio * 100)}%, needs 40%)` };
    }
  } else if (domain.toLowerCase() === 'content') {
    const hasWordCount = allChecks.some((c: any) => c.type === 'word_count');
    if (!hasWordCount) {
      return { valid: false, reason: 'Content project needs word count check' };
    }
  } else if (domain.toLowerCase() === 'design') {
    const hasDesignCheck = allChecks.some((c: any) => c.type === 'design_visual');
    if (!hasDesignCheck) {
      return { valid: false, reason: 'Design project needs at least one design_visual check' };
    }
  }

  return { valid: true, reason: '' };
}

export async function generateSOP(
  briefText: string,
  domain: string,
  timelineDays: number,
  projectId: string
): Promise<GeneratedSOP> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(briefText, domain, timelineDays);

  let responseJson: any;
  try {
    responseJson = await generateJson(userPrompt, systemPrompt);
    logger.info('SOP generated from Gemini (attempt 1)', { project_id: projectId });
  } catch (error) {
    throw new Error(`SOP generation failed: ${(error as Error).message}`);
  }

  const { valid, reason } = validateSOPQuality(responseJson, domain);

  if (!valid) {
    logger.info('SOP validation failed on attempt 1, retrying', { reason, project_id: projectId });
    const retrySystem = systemPrompt + `\n\nPREVIOUS ATTEMPT FEEDBACK: ${reason}\nPlease retry and ensure proper check distribution.`;
    try {
      responseJson = await generateJson(userPrompt, retrySystem);
      logger.info('SOP generated from Gemini (attempt 2)', { project_id: projectId });
    } catch (error) {
      throw new Error(`SOP generation failed on retry: ${(error as Error).message}`);
    }

    const retry = validateSOPQuality(responseJson, domain);
    if (!retry.valid) {
      throw new Error(`SOP generation validation failed after retry: ${retry.reason}`);
    }
  }

  return {
    content_html: responseJson.content_html || '',
    milestones: responseJson.milestones || [],
    version: 1
  };
}
