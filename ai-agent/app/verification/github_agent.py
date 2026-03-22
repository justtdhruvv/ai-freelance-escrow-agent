import httpx
import re
import asyncio
import json

def _parse_repo_url(repo_url: str) -> tuple[str, str]:
    url = repo_url.strip()
    if url.endswith(".git"):
        url = url[:-4]
    url = url.rstrip("/")
    if "/tree/" in url:
        url = url.split("/tree/")[0]
    
    parts = url.split("/")
    if len(parts) >= 2:
        return parts[-2], parts[-1]
    raise ValueError(f"Could not parse repo URL: {repo_url}")

async def get_repo_tree(repo_url: str, github_token: str = None) -> dict:
    try:
        owner, repo = _parse_repo_url(repo_url)
        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
        headers = {"Accept": "application/vnd.github.v3+json"}
        
        # Use token from parameter if provided (client-specific access)
        token = github_token.strip() if github_token else ""
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise ValueError(f"Could not fetch repo tree: {str(e)}")

async def get_file_content(repo_url: str, file_path: str, github_token: str = None) -> str:
    try:
        owner, repo = _parse_repo_url(repo_url)
        # Use GitHub API for authenticated access to private repos
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
        headers = {"Accept": "application/vnd.github.v3.raw"}
        
        token = github_token.strip() if github_token else ""
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.text
    except Exception as e:
        raise ValueError(f"Could not fetch file {file_path}: {str(e)}")

async def find_file_in_tree(tree: dict, target_path: str) -> str | None:
    tree_items = tree.get("tree", [])
    for item in tree_items:
        path = item.get("path", "")
        if path == target_path or path.endswith(target_path):
            return path
    return None

async def check_function_in_file(file_content: str, function_name: str, file_path: str) -> tuple[bool, str]:
    patterns = [
        f"def {function_name}",
        f"function {function_name}",
        f"const {function_name}",
        f"async {function_name}",
        f"{function_name}("
    ]
    for pattern in patterns:
        if pattern in file_content:
            return True, f"Function '{function_name}' found in {file_path}"
            
    return False, f"Function '{function_name}' not found in {file_path}"

async def discover_repo_structure(repo_url: str, github_token: str = None, max_files: int = 100) -> dict:
    """
    Discovers the actual repo structure to understand project layout and tech stack.
    Uses client-provided token for private repo access.
    
    Returns info about: project_type, main_files, directories, file_types, potential_entry_points
    """
    try:
        tree_data = await get_repo_tree(repo_url, github_token)
        tree_items = tree_data.get("tree", [])
        
        structure = {
            "project_type": "unknown",  # Will detect: react, vue, python, nodejs, etc.
            "main_files": [],
            "config_files": [],
            "test_files": [],
            "api_files": [],
            "component_files": [],
            "directories": [],
            "file_types": {},
            "potential_entry_points": [],
            "package_managers": []
        }
        
        # Scan files to understand structure
        all_files = tree_items[:max_files]
        
        for item in all_files:
            path = item.get("path", "")
            
            # Categorize by file type
            if path.endswith((".py", ".js", ".ts", ".tsx", ".jsx", ".go", ".java", ".cs", ".rb", ".php")):
                file_type = path.split(".")[-1]
                structure["file_types"][file_type] = structure["file_types"].get(file_type, 0) + 1
                
                # Categorize by function
                if path.startswith(("test", "tests", "spec", "__tests__", "test_")):
                    structure["test_files"].append(path)
                elif any(x in path.lower() for x in ["route", "api", "controller", "handler", "endpoint", "server"]):
                    structure["api_files"].append(path)
                elif any(x in path.lower() for x in ["component", "page", "view", "screen", "container"]):
                    structure["component_files"].append(path)
                elif path.endswith(("main.py", "app.py", "index.js", "index.ts", "main.go", "Main.java", "app.tsx", "App.jsx")):
                    structure["main_files"].append(path)
                    structure["potential_entry_points"].append(path)
            
            # Detect package managers and tech stack
            if "package.json" in path:
                structure["package_managers"].append("npm")
                structure["project_type"] = "nodejs"  # Likely Node/React/Vue/etc
            if "requirements.txt" in path or "pyproject.toml" in path or "pipfile" in path.lower():
                structure["package_managers"].append("pip")
                structure["project_type"] = "python"
            if "go.mod" in path:
                structure["project_type"] = "golang"
            if "pom.xml" in path or "build.gradle" in path:
                structure["project_type"] = "java"
            
            # Detect specific frameworks
            if path.endswith("next.config.js") or path.endswith("next.config.ts"):
                structure["project_type"] = "nextjs"
            if path.endswith("vue.config.js") or path.endswith("vite.config.js"):
                structure["project_type"] = "vue"  # or vite
            if path.endswith("nuxt.config.ts"):
                structure["project_type"] = "nuxt"
            if path.endswith("svelte.config.js"):
                structure["project_type"] = "svelte"
            if path.endswith("angular.json"):
                structure["project_type"] = "angular"
            if path.endswith("fastapi") or "fastapi" in path.lower():
                structure["project_type"] = "fastapi"
            if path.endswith("django") or "django" in path.lower():
                structure["project_type"] = "django"
            
            # Track directories
            if "/" in path:
                dir_path = path.split("/")[0]
                if dir_path not in structure["directories"]:
                    structure["directories"].append(dir_path)
        
        return structure
    except Exception as e:
        return {
            "project_type": "unknown",
            "error": str(e),
            "all_files": []
        }

async def search_files_by_semantic_match(repo_url: str, repo_tree: dict, semantic_keywords: list[str], github_token: str = None) -> list[str]:
    """
    Searches for files matching semantic requirements (keywords).
    Example: ["payment", "transaction", "stripe"] → finds payment-related files
    
    Args:
        repo_url: GitHub repo URL
        repo_tree: Tree data from get_repo_tree()
        semantic_keywords: List of keywords to search for
        github_token: GitHub token for auth
    
    Returns: List of matching file paths
    """
    try:
        tree_items = repo_tree.get("tree", [])
        matching_files = []
        
        # Keywords normalized to lowercase
        keywords_lower = [k.lower() for k in semantic_keywords]
        
        for item in tree_items:
            path = item.get("path", "").lower()
            
            # Check if file path contains any keyword
            if any(keyword in path for keyword in keywords_lower):
                matching_files.append(item.get("path", ""))
        
        # If no exact matches, try broader search
        if not matching_files and len(tree_items) < 50:  # Only for smaller repos
            for item in tree_items:
                try:
                    file_path = item.get("path", "")
                    if file_path.endswith((".py", ".js", ".ts", ".jsx", ".tsx")):
                        content = await get_file_content(repo_url, file_path, github_token)
                        if any(keyword in content.lower() for keyword in keywords_lower):
                            matching_files.append(file_path)
                except:
                    pass  # Skip files we can't read
        
        return matching_files
    except Exception as e:
        return []

async def analyze_code_quality(repo_url: str, file_path: str, semantic_keywords: list[str], github_token: str = None) -> dict:
    """
    Analyzes code quality by checking:
    1. File is not empty
    2. Contains semantic keywords
    3. Has meaningful code patterns (functions, classes, logic)
    4. Line count suggests real implementation
    
    Returns: {
        "is_meaningful": True/False,
        "issues": [...],
        "keyword_matches": [...],
        "code_patterns_found": [...],
        "line_count": int,
        "confidence": 0.0-1.0
    }
    """
    try:
        content = await get_file_content(repo_url, file_path, github_token)
        
        if not content or not content.strip():
            return {
                "is_meaningful": False,
                "issues": ["File is empty"],
                "keyword_matches": [],
                "code_patterns_found": [],
                "line_count": 0,
                "confidence": 0.0
            }
        
        lines = content.split('\n')
        line_count = len([l for l in lines if l.strip()])  # Count non-empty lines
        
        issues = []
        keyword_matches = []
        code_patterns_found = []
        
        # Check file size (empty or near-empty files are suspicious)
        if line_count < 3:
            issues.append(f"File too small ({line_count} lines) - likely placeholder")
        
        # Check for keywords in content
        content_lower = content.lower()
        for keyword in semantic_keywords:
            if keyword.lower() in content_lower:
                keyword_matches.append(keyword)
        
        # Detect code patterns based on file type
        if file_path.endswith(".py"):
            # Python patterns
            if "def " in content or "class " in content:
                code_patterns_found.append("Function/class definitions")
            if "import" in content or "from" in content:
                code_patterns_found.append("Imports/dependencies")
            if "try:" in content or "except" in content:
                code_patterns_found.append("Error handling")
            if "async def" in content or "await " in content:
                code_patterns_found.append("Async operations")
            if "@" in content and "def" in content:
                code_patterns_found.append("Decorators/middleware")
        
        elif file_path.endswith((".js", ".ts", ".jsx", ".tsx")):
            # JavaScript/TypeScript patterns
            if "function " in content or "const " in content or "let " in content:
                code_patterns_found.append("Function/variable definitions")
            if "import " in content or "require(" in content:
                code_patterns_found.append("Imports/dependencies")
            if "try {" in content or "catch" in content:
                code_patterns_found.append("Error handling")
            if "async " in content or "await " in content:
                code_patterns_found.append("Async operations")
            if "export " in content or "module.exports" in content:
                code_patterns_found.append("Module exports")
            if "class " in content:
                code_patterns_found.append("Class definitions")
        
        # Confidence calculation
        confidence = 0.0
        if line_count >= 10:
            confidence += 0.3
        if keyword_matches:
            confidence += min(0.3, len(keyword_matches) * 0.1)
        if code_patterns_found:
            confidence += min(0.4, len(code_patterns_found) * 0.1)
        
        is_meaningful = confidence >= 0.5 and not issues
        
        return {
            "is_meaningful": is_meaningful,
            "issues": issues,
            "keyword_matches": keyword_matches,
            "code_patterns_found": code_patterns_found,
            "line_count": line_count,
            "confidence": round(confidence, 2)
        }
    except Exception as e:
        return {
            "is_meaningful": False,
            "issues": [f"Could not analyze code: {str(e)}"],
            "keyword_matches": [],
            "code_patterns_found": [],
            "line_count": 0,
            "confidence": 0.0
        }
