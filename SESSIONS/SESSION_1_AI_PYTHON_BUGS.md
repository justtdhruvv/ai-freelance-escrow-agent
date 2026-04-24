# SESSION 1 — Fix AI Service Python Bugs

## Priority: CRITICAL
## Estimated effort: 30-60 min

---

## Project Context
This is an AI Freelance Escrow platform. The AI service is a Python FastAPI app at `ai-agent/`
that runs on port 8001. It has 7 agents (sop, contract, aqa, dispute, pfi, timeline, audit).
The service connects to OpenRouter API for LLM calls.

The agents themselves are well-written. The bugs are all in async/await mismatches and
missing config fields — the service will CRASH at startup or at runtime without these fixes.

---

## Your Scope
**Only touch files in:** `ai-agent/`
**Do NOT touch:** anything in `escrow-service/` or `frontend/`

---

## Read These Files First (in order)
1. `ai-agent/main.py`
2. `ai-agent/app/utils/config.py`
3. `ai-agent/app/utils/openrouter_client.py`
4. `ai-agent/app/agents/aqa_agent.py`
5. `ai-agent/app/agents/audit_agent.py`
6. `ai-agent/app/agents/pfi_agent.py`
7. `ai-agent/app/agents/timeline_agent.py`
8. `ai-agent/.env.example`

---

## Exact Bugs to Fix

### BUG 1 — main.py health check: await on sync function (CRASH)
**File:** `ai-agent/main.py`
**Location:** health_check endpoint (around line 55-65)
**Problem:** `await validate_openrouter_connection()` — `validate_openrouter_connection()` is a
SYNCHRONOUS function in openrouter_client.py. Calling `await` on it throws:
`TypeError: object is not awaitable` — the health endpoint crashes immediately.
**Fix:** Remove the `await` keyword. Call it as a regular function:
```python
openrouter_status = validate_openrouter_connection()
```

### BUG 2 — main.py health check: wrong dict key (KeyError crash)
**File:** `ai-agent/main.py`
**Location:** Same health_check endpoint, line after the fix above
**Problem:** Code accesses `openrouter_status["connected"]` but the function
`validate_openrouter_connection()` returns a dict with key `"status"` (values: "success"/"error"),
not `"connected"`. This throws a `KeyError`.
**Fix:** Change the condition to:
```python
if openrouter_status["status"] == "success":
```

### BUG 3 — config.py: missing settings fields (AttributeError at import)
**File:** `ai-agent/app/utils/config.py`
**Problem:** `ollama_client.py` references `settings.OLLAMA_BASE_URL` and `settings.OLLAMA_MODEL`.
`gemini_client.py` references `settings.GEMINI_API_KEY`. None of these are defined in config.py,
causing `AttributeError` when those clients are imported.
**Fix:** Add these fields to the Settings class in config.py with safe defaults:
```python
OLLAMA_BASE_URL: str = ""
OLLAMA_MODEL: str = "qwen2.5-coder:7b"
GEMINI_API_KEY: str = ""
```
Read the existing config.py first to see the pattern used (Pydantic BaseSettings).

### BUG 4 — aqa_agent.py: missing await on async call (silent wrong behavior)
**File:** `ai-agent/app/agents/aqa_agent.py`
**Location:** The line that calls `enhance_audit_report(result)`
**Problem:** `enhance_audit_report` is an async function defined in audit_agent.py.
Without `await`, it returns a coroutine object instead of the actual result.
`result.audit_report` gets set to a coroutine, not the audit text.
**Fix:** Find the call and add `await`:
```python
result.audit_report = await enhance_audit_report(result)
```

### BUG 5 — main.py pfi endpoint: missing await (if pfi function is async)
**File:** `ai-agent/main.py`
**Location:** `/ai/update-pfi` endpoint handler (around line 159-178)
**Problem:** `calculate_pfi_events()` is called without `await`.
**Fix:** Read pfi_agent.py first. If `calculate_pfi_events` is `async def`, add `await`.
If it's a regular `def`, no change needed.

### BUG 6 — main.py timeline endpoint: missing await (if timeline function is async)
**File:** `ai-agent/main.py`
**Location:** `/ai/generate-timeline` endpoint handler (around line 180-199)
**Problem:** `generate_timeline()` is called without `await`.
**Fix:** Read timeline_agent.py first. If `generate_timeline` is `async def`, add `await`.
If it's a regular `def`, no change needed.

---

## Additional Check
After fixing the above, verify:
- Does `ai-agent/requirements.txt` include all imports used in the agent files?
- Does `.env.example` have `OPENROUTER_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `AI_SERVICE_PORT`?
- If any are missing from requirements.txt, add them.

---

## Completion Checklist
- [x] BUG 1 fixed: `await` removed from sync function call in health check
- [x] BUG 2 fixed: dict key changed from `"connected"` to check `"status" == "success"`
- [x] BUG 3 fixed: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `GEMINI_API_KEY` added to config.py
- [x] BUG 4 checked: already had `await` — no change needed
- [x] BUG 5 checked: `calculate_pfi_events` is sync — no change needed
- [x] BUG 6 checked: `generate_timeline` is sync — no change needed
- [x] requirements.txt verified: added `pydantic-settings`, converted UTF-16 → UTF-8
- [x] .env.example verified: added `GEMINI_API_KEY`

## Session Completed: 2026-04-11
All bugs fixed and verified. AI service migrated from OpenRouter to Gemini 2.5 Flash.
Health check and SOP generation tested and confirmed working.

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on the AI service of an AI Freelance Escrow platform. The AI service is a
Python FastAPI application at ai-agent/ that runs on port 8001. It uses OpenRouter API for LLM calls.

Your job is to fix specific bugs in this service. The agents themselves are well-written — the bugs
are all async/await mismatches and missing config fields. Read the SESSION file at
SESSIONS/SESSION_1_AI_PYTHON_BUGS.md for the full list of bugs with exact locations and fixes.

RULES:
- Read every file listed in "Read These Files First" before making any changes
- Only modify files inside ai-agent/
- Do NOT touch escrow-service/ or frontend/
- Do NOT refactor anything beyond what's listed
- Fix each bug exactly as described
- After all fixes, verify the completion checklist in the session file

Start by reading SESSIONS/SESSION_1_AI_PYTHON_BUGS.md, then read the source files, then fix the bugs.
Work through the checklist one item at a time. Confirm each fix before moving to the next.
```
