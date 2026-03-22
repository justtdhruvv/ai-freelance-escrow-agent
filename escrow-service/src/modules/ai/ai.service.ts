import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface GeneratedMilestone {
  title: string;
  description: string;
  amount: number;
  estimated_days: number;
}

export interface AIGenerationResult {
  milestones: GeneratedMilestone[];
  confidence: number;
  processing_time: number;
}

export class AIService {
  /**
   * Generate milestones from client brief using AI logic
   */
  async generateMilestonesFromBrief(briefId: string): Promise<AIGenerationResult> {
    try {
      // Get client brief
      const brief = await db('client_briefs')
        .where({ brief_id: briefId })
        .first();

      if (!brief) {
        throw new Error('Client brief not found');
      }

      // Get project details for context
      const project = await db('projects')
        .where({ project_id: brief.project_id })
        .first();

      if (!project) {
        throw new Error('Project not found');
      }

      // Simple AI logic for milestone generation
      const milestones = this.generateMilestonesFromText(brief.raw_text, project.total_price);

      // Mark brief as processed
      await db('client_briefs')
        .where({ brief_id: briefId })
        .update({ 
          ai_processed: true,
          ai_generated_requirements: JSON.stringify(milestones)
        });

      const result: AIGenerationResult = {
        milestones,
        confidence: 0.85,
        processing_time: Date.now()
      };

      logger.info('AI generated milestones from brief', {
        brief_id: briefId,
        project_id: brief.project_id,
        milestones_count: milestones.length,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      logger.error('Error generating milestones from brief', error);
      throw new Error('Failed to generate milestones from brief');
    }
  }

  /**
   * Simple milestone generation logic based on text analysis
   */
  private generateMilestonesFromText(rawText: string, totalBudget: number): GeneratedMilestone[] {
    const milestones: GeneratedMilestone[] = [];
    
    // Simple keyword-based milestone generation
    const text = rawText.toLowerCase();
    
    // Determine project type from keywords
    if (text.includes('website') || text.includes('web app') || text.includes('application')) {
      // Web development milestones
      milestones.push(
        {
          title: 'Design and Planning',
          description: 'Create wireframes, mockups, and technical specifications',
          amount: Math.round(totalBudget * 0.15),
          estimated_days: 5
        },
        {
          title: 'Frontend Development',
          description: 'Implement user interface and responsive design',
          amount: Math.round(totalBudget * 0.35),
          estimated_days: 10
        },
        {
          title: 'Backend Development',
          description: 'Build API, database, and server-side logic',
          amount: Math.round(totalBudget * 0.30),
          estimated_days: 8
        },
        {
          title: 'Testing and Deployment',
          description: 'Quality assurance, bug fixes, and production deployment',
          amount: Math.round(totalBudget * 0.20),
          estimated_days: 5
        }
      );
    } else if (text.includes('mobile') || text.includes('app') || text.includes('ios') || text.includes('android')) {
      // Mobile app milestones
      milestones.push(
        {
          title: 'UI/UX Design',
          description: 'Design mobile interface and user experience flow',
          amount: Math.round(totalBudget * 0.20),
          estimated_days: 7
        },
        {
          title: 'Core Features Development',
          description: 'Implement main application functionality',
          amount: Math.round(totalBudget * 0.40),
          estimated_days: 12
        },
        {
          title: 'Platform Integration',
          description: 'Integrate with device features and app stores',
          amount: Math.round(totalBudget * 0.25),
          estimated_days: 6
        },
        {
          title: 'Testing and Launch',
          description: 'QA, bug fixes, and app store submission',
          amount: Math.round(totalBudget * 0.15),
          estimated_days: 4
        }
      );
    } else if (text.includes('content') || text.includes('writing') || text.includes('blog') || text.includes('article')) {
      // Content creation milestones
      milestones.push(
        {
          title: 'Research and Planning',
          description: 'Topic research, keyword analysis, and content strategy',
          amount: Math.round(totalBudget * 0.10),
          estimated_days: 2
        },
        {
          title: 'Content Creation',
          description: 'Write main content pieces and articles',
          amount: Math.round(totalBudget * 0.60),
          estimated_days: 8
        },
        {
          title: 'Review and Optimization',
          description: 'Edit, optimize for SEO, and final review',
          amount: Math.round(totalBudget * 0.30),
          estimated_days: 3
        }
      );
    } else {
      // Generic project milestones
      const milestoneCount = Math.min(5, Math.max(3, Math.round(totalBudget / 10000)));
      const baseAmount = Math.round(totalBudget / milestoneCount);
      
      for (let i = 0; i < milestoneCount; i++) {
        milestones.push({
          title: `Milestone ${i + 1}`,
          description: `Complete phase ${i + 1} of the project`,
          amount: baseAmount,
          estimated_days: Math.ceil(30 / milestoneCount)
        });
      }
    }

    return milestones;
  }

  /**
   * Analyze project complexity and estimate duration
   */
  analyzeProjectComplexity(rawText: string, budget: number): {
    complexity: 'simple' | 'medium' | 'complex';
    estimated_days: number;
    confidence: number;
  } {
    const text = rawText.toLowerCase();
    let complexityScore = 0;
    
    // Complexity indicators
    if (text.includes('complex') || text.includes('advanced')) complexityScore += 3;
    if (text.includes('integration') || text.includes('api')) complexityScore += 2;
    if (text.includes('database') || text.includes('backend')) complexityScore += 2;
    if (text.includes('design') || text.includes('ui')) complexityScore += 1;
    if (text.includes('mobile') || text.includes('responsive')) complexityScore += 1;
    
    // Budget-based complexity
    if (budget > 100000) complexityScore += 2;
    else if (budget > 50000) complexityScore += 1;
    
    let complexity: 'simple' | 'medium' | 'complex';
    let estimatedDays: number;
    
    if (complexityScore >= 6) {
      complexity = 'complex';
      estimatedDays = 45;
    } else if (complexityScore >= 3) {
      complexity = 'medium';
      estimatedDays = 30;
    } else {
      complexity = 'simple';
      estimatedDays = 15;
    }
    
    return {
      complexity,
      estimated_days: estimatedDays,
      confidence: Math.min(0.95, 0.7 + (complexityScore * 0.05))
    };
  }
}
