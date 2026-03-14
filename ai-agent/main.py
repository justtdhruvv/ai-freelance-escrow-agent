from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any
from uuid import uuid4
import traceback

from app.utils.config import settings
from app.utils.openrouter_client import validate_openrouter_connection
from app.schemas.models import (
    AIRequest, AIResponse, ClientBrief, SOP, SOPGenerationRequest, ContractGenerationRequest,
    Submission, MilestoneCheck, VerificationContract, PFIEvent,
    Dispute, AQAResult
)
from app.agents.sop_agent import generate_sop
from app.agents.contract_agent import generate_contract
from app.agents.aqa_agent import run_aqa
from app.agents.dispute_agent import resolve_dispute
from app.agents.pfi_agent import calculate_pfi_events
from app.agents.timeline_agent import generate_timeline

PFI_DELTAS = {
    "aqa_pass": 15,
    "aqa_fail": -20,
    "deadline_met": 10,
    "deadline_missed": -15,
    "dispute_won": 25,
    "dispute_lost": -30,
    "revision_requested": -5
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"AI Service running on port {settings.AI_SERVICE_PORT}")
    yield
    print("AI Service shutting down")

app = FastAPI(
    title="BitByBit AI Service",
    version="1.0.0",
    lifespan=lifespan
)

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint that validates OpenRouter connection and API key.
    """
    openrouter_status = await validate_openrouter_connection()
    return {
        "status": "ok" if openrouter_status["connected"] else "error",
        "openrouter": openrouter_status
    }

@app.post("/ai/generate-sop", response_model=AIResponse)
async def api_generate_sop(request: SOPGenerationRequest):
    try:
        # Extract context fields from flat request
        project_context = {
            "timeline_days": request.timeline_days
        }
        # Create ClientBrief from request
        brief = ClientBrief(
            project_id=request.project_id,
            raw_text=request.raw_text,
            domain=request.domain
        )
        sop = await generate_sop(brief, project_context)
        return AIResponse(
            request_id=None,
            status="success",
            output=sop,
            model_used="openai/gpt-oss-120b:free"
        )
    except Exception as e:
        traceback.print_exc()
        return AIResponse(
            request_id=None,
            status="error",
            error_message=str(e)
        )

@app.post("/ai/generate-contract", response_model=AIResponse)
async def api_generate_contract(request: ContractGenerationRequest):
    try:
        # Convert ContractGenerationRequest to SOP for the agent
        sop = SOP(
            project_id=request.project_id,
            content_html=request.content_html,
            milestones=request.milestones
        )
        contract = await generate_contract(sop, {})
        return AIResponse(
            request_id=None,
            status="success",
            output=contract,
            model_used="openai/gpt-oss-120b:free"
        )
    except Exception as e:
        traceback.print_exc()
        return AIResponse(
            request_id=None,
            status="error",
            error_message=str(e)
        )

@app.post("/ai/run-aqa", response_model=AIResponse)
async def api_run_aqa(request: AIRequest):
    try:
        submission = Submission(**request.payload["submission"])
        milestone = MilestoneCheck(**request.payload["milestone"])
        aqa_result = await run_aqa(submission, milestone, request.context)
        return AIResponse(
            request_id=request.request_id,
            status="success",
            output=aqa_result,
            model_used="local_runners"
        )
    except Exception as e:
        traceback.print_exc()
        return AIResponse(
            request_id=request.request_id,
            status="error",
            error_message=str(e)
        )


@app.post("/ai/resolve-dispute", response_model=AIResponse)
async def api_resolve_dispute(request: AIRequest):
    try:
        dispute = Dispute(**request.payload["dispute"])
        aqa_result = AQAResult(**request.payload["aqa_result"])
        
        result = await resolve_dispute(dispute, aqa_result)
        
        return AIResponse(
            request_id=request.request_id,
            status="success",
            output=result,
            model_used="openai/gpt-oss-120b:free"
        )
    except Exception as e:
        traceback.print_exc()
        return AIResponse(
            request_id=request.request_id,
            status="error",
            error_message=str(e)
        )

@app.post("/ai/update-pfi", response_model=AIResponse)
async def api_update_pfi(request: AIRequest):
    try:
        aqa_result_dict = request.payload.get("aqa_result", {})
        
        events = calculate_pfi_events(aqa_result_dict, request.context)
        
        return AIResponse(
            request_id=request.request_id,
            status="success",
            output=events,
            model_used="openai/gpt-oss-120b:free"
        )
    except Exception as e:
        traceback.print_exc()
        return AIResponse(
            request_id=request.request_id,
            status="error",
            error_message=str(e)
        )

@app.post("/ai/generate-timeline", response_model=AIResponse)
async def api_generate_timeline(request: AIRequest):
    try:
        contract = VerificationContract(**request.payload)
        
        timeline_dict = generate_timeline(contract, request.context)
        
        return AIResponse(
            request_id=request.request_id,
            status="success",
            output=timeline_dict,
            model_used="none"
        )
    except Exception as e:
        traceback.print_exc()
        return AIResponse(
            request_id=request.request_id,
            status="error",
            error_message=str(e)
        )
