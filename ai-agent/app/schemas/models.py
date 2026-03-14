from pydantic import BaseModel
from typing import Optional, Any, Dict, Literal

# Define allowed check types
CheckType = Literal[
    "http_endpoint",
    "file_exists", 
    "function_exists",
    "word_count",
    "keyword_present",
    "readability",
    "figma_frame_count",
    "figma_color_palette",
    "figma_component_names",
    "manual"
]

class AIRequest(BaseModel):
    request_id: Optional[str] = None
    prompt: Optional[str] = None
    payload: Dict[str, Any] = {}
    context: Dict[str, Any] = {}
    metadata: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    request_id: Optional[str] = None
    status: str
    data: Optional[Dict[str, Any]] = None
    output: Any = None
    error_message: Optional[str] = None
    message: Optional[str] = None
    model_used: Optional[str] = None

class ClientBrief(BaseModel):
    project_id: str
    raw_text: str
    domain: str

class SOPGenerationRequest(BaseModel):
    """Flat request format for SOP generation (no nested payload/context)"""
    project_id: str
    raw_text: str
    domain: str
    timeline_days: Optional[int] = 14

class ContractGenerationRequest(BaseModel):
    """Request format for contract generation - uses SOP outputs"""
    project_id: str
    domain: str
    content_html: str
    milestones: list["SOPMilestone"]

class SOPCheck(BaseModel):
    type: str
    description: str
    params: Dict[str, Any]
    verified_by: str

class SOPMilestone(BaseModel):
    title: str
    deadline: str
    payment_amount: Optional[float] = None
    checks: list[SOPCheck]

class SOP(BaseModel):
    project_id: Optional[str] = None
    version: Optional[int] = 1
    content_html: str
    milestones: list[SOPMilestone]

class WordCountParams(BaseModel):
    min: int
    max: int

class KeywordParams(BaseModel):
    keywords: list[str]

class FileExistsParams(BaseModel):
    path: str

class FunctionExistsParams(BaseModel):
    path: str
    function_name: str

class HttpEndpointParams(BaseModel):
    method: str
    endpoint: str
    expected_status: int
    expected_field: Optional[str] = None

class FigmaParams(BaseModel):
    frame_count: Optional[int] = None
    color_palette: Optional[list[str]] = None
    component_names: Optional[list[str]] = None

class VerificationCheck(SOPCheck):
    result: str = "pending"
    evidence: Optional[str] = None
    verified_at: Optional[str] = None

class VContractMilestone(BaseModel):
    milestone_id: str
    project_id: str
    title: str
    deadline: str
    payment_amount: int
    status: str = "pending"
    checks: list[VerificationCheck] = []
    manual_checks: list[VerificationCheck] = []
    revisions_used: int = 0
    max_revisions: int = 2

class VerificationContract(BaseModel):
    project_id: Optional[str] = None
    generated_from_sop_version: Optional[int] = None
    freelancer_approved: bool = False
    client_approved: bool = False
    locked_at: Optional[str] = None
    milestones: list[VContractMilestone]

class Submission(BaseModel):
    submission_id: str
    project_id: str
    milestone_id: str
    type: str # e.g. "code", "content_text"
    content: Optional[str] = None
    repo_url: Optional[str] = None

class MilestoneCheck(BaseModel):
    milestone_id: Optional[str] = None
    project_id: str
    title: str
    deadline: str
    payment_amount: int
    checks: list[VerificationCheck] = []
    manual_checks: list[VerificationCheck] = []

class AuditReport(BaseModel):
    aqa_id: Optional[str] = None
    summary: str
    passed_checks: list[str] = []
    failed_checks: list[Dict[str, str]] = []
    missing_items: list[str] = []
    comparison_table: list[Dict[str, str]] = []

class AQAResult(BaseModel):
    aqa_id: str
    milestone_id: str
    submission_id: str
    verdict: str
    pass_rate: float
    payment_trigger: str
    audit_report: AuditReport
    milestone_amount: Optional[int] = None  # in USD cents, for PFI weighting
    all_checks: list[VerificationCheck] = []

class PFIEvent(BaseModel):
    type: str # e.g. "aqa_pass" or "aqa_fail"
    delta: int
    project_id: str
    applied: bool = True
    calculation_breakdown: Optional[str] = None

class Dispute(BaseModel):
    dispute_id: str
    project_id: str
    milestone_id: str
    reason: str
    raised_by: str # e.g. "client" or "freelancer"
    status: str = "open"