from datetime import datetime
from app.schemas.models import AuditReport, AQAResult
from app.utils.openrouter_client import generate_json_async as generate_json
from app.prompts.audit_prompt import build_audit_system_prompt, build_audit_user_prompt

async def enhance_audit_report(aqa_result: AQAResult) -> AuditReport:
    """
    Enhances a basic AuditReport into a natural language, LLM-generated comprehensive summary report.
    """
    system_prompt = build_audit_system_prompt()
    user_prompt = build_audit_user_prompt(aqa_result)
    
    try:
        response_json = await generate_json(prompt=user_prompt, system=system_prompt)
        print(f"DEBUG - Raw Audit Generator Response: {response_json}")
        
        # We manually build the schema to map native fields like aqa_id securely
        enhanced_report = AuditReport(**response_json)
        enhanced_report.aqa_id = aqa_result.aqa_id
        
        # Attach generation timestamp dynamically (optional but requested context logic)
        enhanced_report.summary += f" [Generated at {datetime.utcnow().isoformat()}Z]"
        
        return enhanced_report
        
    except Exception as e:
        print(f"DEBUG - Audit enhancement failed, falling back to basic report. Error: {str(e)}")
        # If any parsing, casting, or connection error happens, silently fail over to the basic report
        return aqa_result.audit_report
