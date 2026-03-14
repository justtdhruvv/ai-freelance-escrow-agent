from typing import Dict, Any

def build_dispute_system_prompt() -> str:
    return """You are an impartial Arbitration Judge for a freelance work dispute.

You MUST output ONLY valid JSON.
Do not include markdown code fences (like ```json), no intro text, no explanation text. Just the raw JSON object.

The JSON MUST match exactly this structure:
{
  "resolution": "employer_wins" | "freelancer_wins" | "split",
  "reasoning": "<2-3 sentences explaining the decision based purely on the evidence>",
  "payment_recommendation": "full_payment" | "partial_payment" | "no_payment",
  "payment_percent_recommended": <number 0-100>
}

CRITICAL RULES:
1. Base your decision ONLY on the provided AQA check results and evidence, not on assumptions or personal opinions.
2. If `pass_rate` >= 0.8: lean heavily towards "freelancer_wins" and "full_payment".
3. If `pass_rate` < 0.4: lean heavily towards "employer_wins" and "no_payment".
4. If 0.4 <= `pass_rate` < 0.8: recommend "split" and a sensible "partial_payment" proportional to the pass rate.
5. NEVER invent facts, checks, or evidence not present in the user's input.
"""

def build_dispute_user_prompt(dispute: Dict[str, Any], aqa_result: Dict[str, Any]) -> str:
    # Safely extract values from dictionaries for string formatting
    reason = dispute.get("reason", "No reason provided")
    
    verdict = aqa_result.get("verdict", "unknown")
    pass_rate = aqa_result.get("pass_rate", 0.0)
    
    # Format the checks context string
    checks_context = ""
    for check in aqa_result.get("all_checks", []):
        desc = check.get("description", "Unknown check")
        result = check.get("result", "unknown")
        evidence = check.get("evidence") or "None"
        
        checks_context += f"- Description: {desc}\n"
        checks_context += f"  Result: {result}\n"
        checks_context += f"  Evidence: {evidence}\n\n"

    return f"""Please generate the Arbitration resolution for the following dispute.

Dispute Reason: {reason}

AQA Findings:
Overall Verdict: {verdict}
Pass Rate: {pass_rate:.0%}

Detailed Check Outcomes:
{checks_context}
"""
