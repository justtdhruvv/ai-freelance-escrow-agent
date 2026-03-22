import os
from typing import Any, Dict
from datetime import datetime
import httpx
import re

from app.schemas.models import VerificationCheck
from app.verification.github_agent import (
    get_repo_tree, 
    get_file_content, 
    find_file_in_tree, 
    check_function_in_file,
    discover_repo_structure,
    search_files_by_semantic_match,
    analyze_code_quality
)

async def run_http_endpoint(check: VerificationCheck, base_url: str) -> VerificationCheck:
    params = check.params
    method = params.get("method", "GET").upper()
    endpoint = params.get("endpoint", "")
    expected_status = params.get("expected_status", 200)
    expected_field = params.get("expected_field")

    # Handle empty or None base_url
    if not base_url or not base_url.strip():
        check.result = "partial"
        check.evidence = "No server URL provided. Endpoint check skipped. Manual verification required."
        check.verified_by = "manual"
        return check

    url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            request = client.build_request(method, url)
            response = await client.send(request)
            
            actual_status = response.status_code
            response_text = response.text
            
            if actual_status != expected_status:
                check.result = "fail"
                check.evidence = f"Expected status {expected_status}, got {actual_status}. Response: {response_text[:200]}"
                return check
                
            if expected_field:
                try:
                    data = response.json()
                    if expected_field not in data:
                        check.result = "partial"
                        check.evidence = f"Status ok, but field '{expected_field}' missing in response."
                        return check
                except ValueError:
                    check.result = "fail"
                    check.evidence = f"Status ok, but response is not valid JSON to check for '{expected_field}'."
                    return check

            check.result = "pass"
            check.evidence = f"Endpoint responded with {actual_status} and required fields present."
            return check
            
    except Exception as e:
        check.result = "fail"
        check.evidence = str(e)
        return check

async def run_file_exists(check: VerificationCheck, repo_url: str, github_token: str = None) -> VerificationCheck:
    params = check.params
    target_path = params.get("path", "")
    
    try:
        tree = await get_repo_tree(repo_url, github_token)
        found_path = await find_file_in_tree(tree, target_path)
        
        if found_path is not None:
            check.result = "pass"
            check.evidence = f"File found at {found_path} in repository"
        else:
            check.result = "fail"
            check.evidence = f"File '{target_path}' not found in repository tree"
            
    except Exception as e:
        check.result = "fail"
        check.evidence = f"GitHub API error: {str(e)}"
        
    return check

async def run_function_exists(check: VerificationCheck, repo_url: str, github_token: str = None) -> VerificationCheck:
    params = check.params
    target_path = params.get("path", "")
    function_name = params.get("function_name", "")
    
    try:
        tree = await get_repo_tree(repo_url, github_token)
        found_path = await find_file_in_tree(tree, target_path)
        
        if found_path is None:
            check.result = "fail"
            check.evidence = f"File '{target_path}' not found in repository"
            return check
            
        content = await get_file_content(repo_url, found_path, github_token)
        found, evidence_msg = await check_function_in_file(content, function_name, found_path)
        
        check.result = "pass" if found else "fail"
        check.evidence = evidence_msg
        
    except Exception as e:
        check.result = "fail"
        check.evidence = f"GitHub API error: {str(e)}"
        
    return check

async def run_readability_check(check: VerificationCheck, content: str) -> VerificationCheck:
    """
    Evaluates content readability based on sentence length and paragraph structure.
    """
    # Split sentences by common delimiters
    import re
    sentences = re.split(r'[.!?]+', content)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Count paragraphs (split by double newlines)
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    
    if not sentences:
        check.result = "fail"
        check.evidence = "No readable content found"
        return check
    
    # Calculate average words per sentence
    total_words = len(content.split())
    avg_words_per_sentence = total_words / len(sentences) if sentences else 0
    
    if avg_words_per_sentence > 30:
        check.result = "fail"
        check.evidence = f"Sentences too long, avg {avg_words_per_sentence:.1f} words. Max 30 recommended."
        return check
    
    if len(paragraphs) < 2:
        check.result = "partial"
        check.evidence = "Content needs multiple paragraphs for structure"
        return check
    
    check.result = "pass"
    check.evidence = f"Readable: {avg_words_per_sentence:.1f} avg words/sentence, {len(paragraphs)} paragraphs"
    return check

async def run_word_count(check: VerificationCheck, content: str) -> VerificationCheck:
    params = check.params
    min_words = params.get("min", 0)
    max_words = params.get("max", float('inf'))
    
    words = content.split()
    word_count = len(words)
    
    if min_words <= word_count <= max_words:
        check.result = "pass"
    elif word_count < min_words:
        check.result = "fail"
    else:
        check.result = "partial"
        
    check.evidence = f"Word count: {word_count}. Required: {min_words}-{max_words}"
    return check

async def run_code_feature(check: VerificationCheck, repo_url: str, github_token: str = None) -> VerificationCheck:
    """
    Semantic code feature check - searches for files matching the requirement keyword AND analyzes code quality.
    Prevents fake implementation (empty files).
    
    Example: "Payment processing" → finds payment.py → analyzes code → checks for real implementation
    """
    params = check.params
    semantic_requirement = params.get("semantic_requirement", "")
    
    if not semantic_requirement:
        check.result = "fail"
        check.evidence = "Semantic requirement not specified"
        return check
    
    try:
        # Discover repo structure
        repo_structure = await discover_repo_structure(repo_url, github_token)
        
        if "error" in repo_structure:
            check.result = "fail"
            check.evidence = f"Could not analyze repo structure: {repo_structure.get('error')}"
            return check
        
        # Get repo tree
        tree = await get_repo_tree(repo_url, github_token)
        
        # Extract keywords from semantic requirement
        keywords = re.findall(r'\b\w+\b', semantic_requirement.lower())
        
        # Search for matching files
        matching_files = await search_files_by_semantic_match(repo_url, tree, keywords, github_token)
        
        if not matching_files:
            check.result = "fail"
            check.evidence = f"Could not find implementation matching: {semantic_requirement}"
            return check
        
        # Analyze code quality in matching files
        file_analyses = []
        meaningful_implementations = []
        
        for file_path in matching_files[:5]:  # Analyze first 5 matches
            analysis = await analyze_code_quality(repo_url, file_path, keywords, github_token)
            file_analyses.append((file_path, analysis))
            
            if analysis["is_meaningful"]:
                meaningful_implementations.append({
                    "file": file_path,
                    "analysis": analysis
                })
        
        # Determine result based on code quality
        if meaningful_implementations:
            check.result = "pass"
            top_file = meaningful_implementations[0]
            evidence = f"Found meaningful implementation in: {top_file['file']}\n"
            evidence += f"  - Code patterns: {', '.join(top_file['analysis']['code_patterns_found'])}\n"
            evidence += f"  - Keywords found: {', '.join(top_file['analysis']['keyword_matches'])}\n"
            evidence += f"  - Lines of code: {top_file['analysis']['line_count']}\n"
            evidence += f"  - Confidence: {top_file['analysis']['confidence']:.0%}"
            
            if len(meaningful_implementations) > 1:
                evidence += f" (+{len(meaningful_implementations)-1} more files with implementation)"
            
            check.evidence = evidence
        else:
            # All files were empty or suspicious
            check.result = "fail"
            issues = []
            for file_path, analysis in file_analyses:
                if analysis["issues"]:
                    issues.extend([f"{file_path}: {issue}" for issue in analysis["issues"]])
            
            check.evidence = "Files found but contain no meaningful implementation (empty or placeholder files). "
            check.evidence += "Issues: " + "; ".join(issues[:3])  # First 3 issues
        
        # Add project type for context
        project_type = repo_structure.get("project_type", "unknown")
        if project_type != "unknown":
            check.evidence += f"\nProject type: {project_type}"
            
    except Exception as e:
        check.result = "fail"
        check.evidence = f"Analysis error: {str(e)}"
    
    return check

async def run_keyword_present(check: VerificationCheck, content: str) -> VerificationCheck:
    params = check.params
    keywords = params.get("keywords", [])
    
    content_lower = content.lower()
    
    found = [k for k in keywords if k.lower() in content_lower]
    missing = [k for k in keywords if k.lower() not in content_lower]
    
    if not missing:
        check.result = "pass"
    elif found:
        check.result = "partial"
    else:
        check.result = "fail"
        
    check.evidence = f"Found: {found}. Missing: {missing}"
    return check

async def run_check(check: VerificationCheck, context: dict) -> VerificationCheck:
    """
    Dispatches to the correct runner based on check.type.
    """
    check_type = check.type
    
    if check_type == "manual":
        check.result = "pending"
        check.evidence = "Requires manual review"
    elif check_type == "http_endpoint":
        base_url = context.get("base_url", "")
        await run_http_endpoint(check, base_url)
    elif check_type == "file_exists":
        repo_url = context.get("repo_url", "")
        github_token = context.get("github_token", "")
        await run_file_exists(check, repo_url, github_token)
    elif check_type == "function_exists":
        repo_url = context.get("repo_url", "")
        github_token = context.get("github_token", "")
        await run_function_exists(check, repo_url, github_token)
    elif check_type == "word_count":
        content = context.get("content", "")
        await run_word_count(check, content)
    elif check_type == "keyword_present":
        content = context.get("content", "")
        await run_keyword_present(check, content)
    elif check_type == "readability":
        content = context.get("content", "")
        await run_readability_check(check, content)
    elif check_type == "code_feature":
        repo_url = context.get("repo_url", "")
        github_token = context.get("github_token", "")
        await run_code_feature(check, repo_url, github_token)
    else:
        # Default fallback for unknown auto checks (e.g. figma integrations not yet supported)
        check.result = "fail"
        check.evidence = f"Unsupported check type: {check_type}"

    # Standardize verified_at
    check.verified_at = datetime.utcnow().isoformat() + "Z"
    
    return check
