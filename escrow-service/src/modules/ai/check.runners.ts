import axios from 'axios';
import { analyzeDesignImage } from '../../utils/gemini.client';
import {
  getRepoTree,
  getFileContent,
  findFileInTree,
  checkFunctionInFile,
  discoverRepoStructure,
  searchFilesBySemanticMatch,
  analyzeCodeQuality
} from './github.agent';

export interface VerificationCheck {
  check_id: string;
  type: string;
  description: string;
  params: Record<string, any>;
  result?: string;
  evidence?: string;
  verified_by?: string;
  verified_at?: string;
}

async function runHttpEndpoint(check: VerificationCheck, baseUrl: string): Promise<VerificationCheck> {
  const { method = 'GET', endpoint = '', expected_status = 200, expected_field } = check.params;

  if (!baseUrl?.trim()) {
    check.result = 'partial';
    check.evidence = 'No server URL provided. Endpoint check skipped. Manual verification required.';
    check.verified_by = 'manual';
    return check;
  }

  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0'];
  if (localhostPatterns.some(p => baseUrl.includes(p))) {
    check.result = 'partial';
    check.evidence = 'Server-side AQA cannot reach localhost endpoints. Deploy your server or provide a public URL. Manual verification required.';
    check.verified_by = 'manual';
    return check;
  }

  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const response = await axios.request({
      method: method.toUpperCase(),
      url,
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status !== expected_status) {
      check.result = 'fail';
      check.evidence = `Expected status ${expected_status}, got ${response.status}`;
      return check;
    }

    if (expected_field) {
      const data = response.data;
      if (typeof data !== 'object' || !(expected_field in data)) {
        check.result = 'partial';
        check.evidence = `Status ok, but field '${expected_field}' missing in response.`;
        return check;
      }
    }

    check.result = 'pass';
    check.evidence = `Endpoint responded with ${response.status} and required fields present.`;
  } catch (error) {
    check.result = 'fail';
    check.evidence = (error as Error).message;
  }

  return check;
}

async function runFileExists(check: VerificationCheck, repoUrl: string, githubToken?: string): Promise<VerificationCheck> {
  const targetPath: string = check.params.path || '';
  try {
    const tree = await getRepoTree(repoUrl, githubToken);
    const found = await findFileInTree(tree, targetPath);
    if (found) {
      check.result = 'pass';
      check.evidence = `File found at ${found} in repository`;
    } else {
      check.result = 'fail';
      check.evidence = `File '${targetPath}' not found in repository tree`;
    }
  } catch (error) {
    check.result = 'fail';
    check.evidence = `GitHub API error: ${(error as Error).message}`;
  }
  return check;
}

async function runFunctionExists(check: VerificationCheck, repoUrl: string, githubToken?: string): Promise<VerificationCheck> {
  const targetPath: string = check.params.path || '';
  const functionName: string = check.params.function_name || '';
  try {
    const tree = await getRepoTree(repoUrl, githubToken);
    const found = await findFileInTree(tree, targetPath);
    if (!found) {
      check.result = 'fail';
      check.evidence = `File '${targetPath}' not found in repository`;
      return check;
    }
    const content = await getFileContent(repoUrl, found, githubToken);
    const [exists, evidence] = checkFunctionInFile(content, functionName, found);
    check.result = exists ? 'pass' : 'fail';
    check.evidence = evidence;
  } catch (error) {
    check.result = 'fail';
    check.evidence = `GitHub API error: ${(error as Error).message}`;
  }
  return check;
}

async function runReadabilityCheck(check: VerificationCheck, content: string): Promise<VerificationCheck> {
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const paragraphs = content.split(/\n\n/).map(p => p.trim()).filter(Boolean);

  if (sentences.length === 0) {
    check.result = 'fail';
    check.evidence = 'No readable content found';
    return check;
  }

  const totalWords = content.split(/\s+/).length;
  const avgWordsPerSentence = totalWords / sentences.length;

  if (avgWordsPerSentence > 30) {
    check.result = 'fail';
    check.evidence = `Sentences too long, avg ${avgWordsPerSentence.toFixed(1)} words. Max 30 recommended.`;
    return check;
  }

  if (paragraphs.length < 2) {
    check.result = 'partial';
    check.evidence = 'Content needs multiple paragraphs for structure';
    return check;
  }

  check.result = 'pass';
  check.evidence = `Readable: ${avgWordsPerSentence.toFixed(1)} avg words/sentence, ${paragraphs.length} paragraphs`;
  return check;
}

async function runWordCount(check: VerificationCheck, content: string): Promise<VerificationCheck> {
  const minWords: number = check.params.min || 0;
  const maxWords: number = check.params.max || Infinity;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  if (minWords <= wordCount && wordCount <= maxWords) {
    check.result = 'pass';
  } else if (wordCount < minWords) {
    check.result = 'fail';
  } else {
    check.result = 'partial';
  }

  check.evidence = `Word count: ${wordCount}. Required: ${minWords}-${maxWords === Infinity ? '∞' : maxWords}`;
  return check;
}

async function runKeywordPresent(check: VerificationCheck, content: string): Promise<VerificationCheck> {
  const keywords: string[] = check.params.keywords || [];
  const contentLower = content.toLowerCase();
  const found = keywords.filter(k => contentLower.includes(k.toLowerCase()));
  const missing = keywords.filter(k => !contentLower.includes(k.toLowerCase()));

  if (missing.length === 0) {
    check.result = 'pass';
  } else if (found.length > 0) {
    check.result = 'partial';
  } else {
    check.result = 'fail';
  }

  check.evidence = `Found: [${found.join(', ')}]. Missing: [${missing.join(', ')}]`;
  return check;
}

async function runCodeFeature(check: VerificationCheck, repoUrl: string, githubToken?: string): Promise<VerificationCheck> {
  const semanticRequirement: string = check.params.semantic_requirement || '';

  if (!semanticRequirement) {
    check.result = 'fail';
    check.evidence = 'Semantic requirement not specified';
    return check;
  }

  try {
    const repoStructure = await discoverRepoStructure(repoUrl, githubToken);

    if (repoStructure.error) {
      check.result = 'fail';
      check.evidence = `Could not analyze repo structure: ${repoStructure.error}`;
      return check;
    }

    const tree = await getRepoTree(repoUrl, githubToken);
    const keywords = semanticRequirement.toLowerCase().match(/\b\w+\b/g) || [];
    const matchingFiles = await searchFilesBySemanticMatch(repoUrl, tree, keywords, githubToken);

    if (matchingFiles.length === 0) {
      check.result = 'fail';
      check.evidence = `Could not find implementation matching: ${semanticRequirement}`;
      return check;
    }

    const fileAnalyses: Array<[string, any]> = [];
    const meaningfulImpls: any[] = [];

    for (const filePath of matchingFiles.slice(0, 5)) {
      const analysis = await analyzeCodeQuality(repoUrl, filePath, keywords, githubToken);
      fileAnalyses.push([filePath, analysis]);
      if (analysis.is_meaningful) {
        meaningfulImpls.push({ file: filePath, analysis });
      }
    }

    if (meaningfulImpls.length > 0) {
      const top = meaningfulImpls[0];
      let evidence = `Found meaningful implementation in: ${top.file}\n`;
      evidence += `  - Code patterns: ${top.analysis.code_patterns_found.join(', ')}\n`;
      evidence += `  - Keywords found: ${top.analysis.keyword_matches.join(', ')}\n`;
      evidence += `  - Lines of code: ${top.analysis.line_count}\n`;
      evidence += `  - Confidence: ${Math.round(top.analysis.confidence * 100)}%`;
      if (meaningfulImpls.length > 1) evidence += ` (+${meaningfulImpls.length - 1} more files)`;
      check.result = 'pass';
      check.evidence = evidence;
    } else {
      const issues = fileAnalyses.flatMap(([fp, a]) => (a.issues || []).map((i: string) => `${fp}: ${i}`));
      check.result = 'fail';
      check.evidence = `Files found but contain no meaningful implementation. Issues: ${issues.slice(0, 3).join('; ')}`;
    }

    const projectType = repoStructure.project_type;
    if (projectType && projectType !== 'unknown') {
      check.evidence = (check.evidence || '') + `\nProject type: ${projectType}`;
    }
  } catch (error) {
    check.result = 'fail';
    check.evidence = `Analysis error: ${(error as Error).message}`;
  }

  return check;
}

async function runDesignVisual(check: VerificationCheck): Promise<VerificationCheck> {
  const imageUrl: string = check.params.image_url || '';
  const requirements: string[] = check.params.requirements || [];

  if (!imageUrl) {
    check.result = 'fail';
    check.evidence = 'No design image URL provided in submission';
    return check;
  }

  if (requirements.length === 0) {
    check.result = 'fail';
    check.evidence = 'No design requirements specified in check params';
    return check;
  }

  try {
    const analysis = await analyzeDesignImage(imageUrl, requirements);
    if (analysis.pass) {
      check.result = 'pass';
    } else if (analysis.score >= 50) {
      check.result = 'partial';
    } else {
      check.result = 'fail';
    }
    check.evidence = `Design score: ${analysis.score}/100. ${analysis.evidence}`;
  } catch (error) {
    check.result = 'fail';
    check.evidence = `Design analysis error: ${(error as Error).message}`;
  }

  return check;
}

export async function runCheck(check: VerificationCheck, context: Record<string, string>): Promise<VerificationCheck> {
  const checkType = check.type;
  const now = new Date().toISOString();

  switch (checkType) {
    case 'manual':
      check.result = 'pending';
      check.evidence = 'Requires manual review';
      break;
    case 'http_endpoint':
      await runHttpEndpoint(check, context.base_url || '');
      break;
    case 'file_exists':
      await runFileExists(check, context.repo_url || '', context.github_token);
      break;
    case 'function_exists':
      await runFunctionExists(check, context.repo_url || '', context.github_token);
      break;
    case 'word_count':
      await runWordCount(check, context.content || '');
      break;
    case 'keyword_present':
      await runKeywordPresent(check, context.content || '');
      break;
    case 'readability':
      await runReadabilityCheck(check, context.content || '');
      break;
    case 'code_feature':
      await runCodeFeature(check, context.repo_url || '', context.github_token);
      break;
    case 'design_visual':
      await runDesignVisual(check);
      break;
    case 'figma_frame_count':
    case 'figma_color_palette':
    case 'figma_component_names':
      check.result = 'partial';
      check.evidence = 'Figma metadata check requires manual verification. Freelancer should submit Figma link in submission content.';
      check.verified_by = 'manual';
      break;
    default:
      check.result = 'fail';
      check.evidence = `Unsupported check type: ${checkType}`;
  }

  check.verified_at = now;
  return check;
}
