import axios from 'axios';

function parseRepoUrl(repoUrl: string): [string, string] {
  let url = repoUrl.trim();
  if (url.endsWith('.git')) url = url.slice(0, -4);
  url = url.replace(/\/$/, '');
  if (url.includes('/tree/')) url = url.split('/tree/')[0];

  const parts = url.split('/');
  if (parts.length >= 2) {
    return [parts[parts.length - 2], parts[parts.length - 1]];
  }
  throw new Error(`Could not parse repo URL: ${repoUrl}`);
}

function makeHeaders(githubToken?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (githubToken?.trim()) {
    headers['Authorization'] = `Bearer ${githubToken.trim()}`;
  }
  return headers;
}

export async function getRepoTree(repoUrl: string, githubToken?: string): Promise<any> {
  const [owner, repo] = parseRepoUrl(repoUrl);
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;

  const response = await axios.get(url, {
    headers: makeHeaders(githubToken),
    timeout: 15000
  });
  return response.data;
}

export async function getFileContent(repoUrl: string, filePath: string, githubToken?: string): Promise<string> {
  const [owner, repo] = parseRepoUrl(repoUrl);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const response = await axios.get(url, {
    headers: { ...makeHeaders(githubToken), Accept: 'application/vnd.github.v3.raw' },
    timeout: 15000
  });
  return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
}

export async function findFileInTree(tree: any, targetPath: string): Promise<string | null> {
  const items: any[] = tree.tree || [];
  for (const item of items) {
    const path: string = item.path || '';
    if (path === targetPath || path.endsWith(targetPath)) {
      return path;
    }
  }
  return null;
}

export function checkFunctionInFile(fileContent: string, functionName: string, filePath: string): [boolean, string] {
  const patterns = [
    `def ${functionName}`,
    `function ${functionName}`,
    `const ${functionName}`,
    `async ${functionName}`,
    `${functionName}(`
  ];
  for (const pattern of patterns) {
    if (fileContent.includes(pattern)) {
      return [true, `Function '${functionName}' found in ${filePath}`];
    }
  }
  return [false, `Function '${functionName}' not found in ${filePath}`];
}

export async function discoverRepoStructure(repoUrl: string, githubToken?: string): Promise<any> {
  try {
    const treeData = await getRepoTree(repoUrl, githubToken);
    const items: any[] = (treeData.tree || []).slice(0, 100);

    const structure: any = {
      project_type: 'unknown',
      main_files: [],
      config_files: [],
      test_files: [],
      api_files: [],
      component_files: [],
      directories: [],
      file_types: {},
      potential_entry_points: [],
      package_managers: []
    };

    for (const item of items) {
      const path: string = item.path || '';
      const lpath = path.toLowerCase();

      if (/\.(py|js|ts|tsx|jsx|go|java|cs|rb|php)$/.test(path)) {
        const ext = path.split('.').pop()!;
        structure.file_types[ext] = (structure.file_types[ext] || 0) + 1;

        if (/^(test|tests|spec|__tests__|test_)/.test(lpath)) {
          structure.test_files.push(path);
        } else if (/route|api|controller|handler|endpoint|server/.test(lpath)) {
          structure.api_files.push(path);
        } else if (/component|page|view|screen|container/.test(lpath)) {
          structure.component_files.push(path);
        } else if (/(main\.py|app\.py|index\.js|index\.ts|main\.go|app\.tsx|App\.jsx)$/.test(path)) {
          structure.main_files.push(path);
          structure.potential_entry_points.push(path);
        }
      }

      if (path.includes('package.json')) {
        structure.package_managers.push('npm');
        structure.project_type = 'nodejs';
      }
      if (/requirements\.txt|pyproject\.toml|pipfile/i.test(path)) {
        structure.package_managers.push('pip');
        structure.project_type = 'python';
      }
      if (path === 'go.mod') structure.project_type = 'golang';
      if (/pom\.xml|build\.gradle/.test(path)) structure.project_type = 'java';
      if (/next\.config\.(js|ts)$/.test(path)) structure.project_type = 'nextjs';
      if (/vue\.config\.js|vite\.config\.js$/.test(path)) structure.project_type = 'vue';
      if (/angular\.json$/.test(path)) structure.project_type = 'angular';

      if (path.includes('/')) {
        const dir = path.split('/')[0];
        if (!structure.directories.includes(dir)) structure.directories.push(dir);
      }
    }

    return structure;
  } catch (error) {
    return { project_type: 'unknown', error: (error as Error).message };
  }
}

export async function searchFilesBySemanticMatch(
  repoUrl: string,
  repoTree: any,
  keywords: string[],
  githubToken?: string
): Promise<string[]> {
  try {
    const items: any[] = repoTree.tree || [];
    const kwLower = keywords.map(k => k.toLowerCase());
    const matches: string[] = [];

    for (const item of items) {
      const path: string = (item.path || '').toLowerCase();
      if (kwLower.some(kw => path.includes(kw))) {
        matches.push(item.path);
      }
    }

    if (matches.length === 0 && items.length < 50) {
      for (const item of items) {
        const filePath: string = item.path || '';
        if (!/\.(py|js|ts|jsx|tsx)$/.test(filePath)) continue;
        try {
          const content = await getFileContent(repoUrl, filePath, githubToken);
          if (kwLower.some(kw => content.toLowerCase().includes(kw))) {
            matches.push(filePath);
          }
        } catch {
          // skip unreadable files
        }
      }
    }

    return matches;
  } catch {
    return [];
  }
}

export async function analyzeCodeQuality(
  repoUrl: string,
  filePath: string,
  keywords: string[],
  githubToken?: string
): Promise<any> {
  try {
    const content = await getFileContent(repoUrl, filePath, githubToken);

    if (!content?.trim()) {
      return { is_meaningful: false, issues: ['File is empty'], keyword_matches: [], code_patterns_found: [], line_count: 0, confidence: 0 };
    }

    const lines = content.split('\n').filter(l => l.trim()).length;
    const issues: string[] = [];
    if (lines < 3) issues.push(`File too small (${lines} lines) - likely placeholder`);

    const contentLower = content.toLowerCase();
    const keywordMatches = keywords.filter(k => contentLower.includes(k.toLowerCase()));
    const codePatterns: string[] = [];

    if (/\.py$/.test(filePath)) {
      if (/def |class /.test(content)) codePatterns.push('Function/class definitions');
      if (/import |from /.test(content)) codePatterns.push('Imports/dependencies');
      if (/try:|except/.test(content)) codePatterns.push('Error handling');
      if (/async def|await /.test(content)) codePatterns.push('Async operations');
    } else if (/\.(js|ts|jsx|tsx)$/.test(filePath)) {
      if (/function |const |let /.test(content)) codePatterns.push('Function/variable definitions');
      if (/import |require\(/.test(content)) codePatterns.push('Imports/dependencies');
      if (/try \{|catch/.test(content)) codePatterns.push('Error handling');
      if (/async |await /.test(content)) codePatterns.push('Async operations');
      if (/export |module\.exports/.test(content)) codePatterns.push('Module exports');
      if (/class /.test(content)) codePatterns.push('Class definitions');
    }

    let confidence = 0;
    if (lines >= 10) confidence += 0.3;
    confidence += Math.min(0.3, keywordMatches.length * 0.1);
    confidence += Math.min(0.4, codePatterns.length * 0.1);
    confidence = Math.round(confidence * 100) / 100;

    return {
      is_meaningful: confidence >= 0.5 && issues.length === 0,
      issues,
      keyword_matches: keywordMatches,
      code_patterns_found: codePatterns,
      line_count: lines,
      confidence
    };
  } catch (error) {
    return {
      is_meaningful: false,
      issues: [`Could not analyze code: ${(error as Error).message}`],
      keyword_matches: [],
      code_patterns_found: [],
      line_count: 0,
      confidence: 0
    };
  }
}
