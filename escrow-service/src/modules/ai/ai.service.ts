import db from '../../config/database';
import { logger } from '../../utils/logger';
import { generateSOP } from './sop.generator';

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
  async generateMilestonesFromBrief(briefId: string): Promise<AIGenerationResult> {
    const startTime = Date.now();

    const brief = await db('client_briefs').where({ brief_id: briefId }).first();
    if (!brief) throw new Error('Client brief not found');

    const project = await db('projects').where({ project_id: brief.project_id }).first();
    if (!project) throw new Error('Project not found');

    const totalPrice: number = project.total_price || 0;
    const totalDays: number = project.timeline_days || 30;
    let milestones: GeneratedMilestone[];
    let usedFallback = false;

    try {
      const sop = await generateSOP(
        brief.raw_text,
        brief.domain || 'general',
        totalDays,
        brief.project_id
      );

      const now = new Date();
      milestones = sop.milestones.map((m: any) => {
        const deadline = m.deadline ? new Date(m.deadline) : new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000);
        const estimatedDays = Math.max(1, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          title: m.title || '',
          description: m.checks && m.checks.length > 0
            ? m.checks.map((c: any) => c.description).filter(Boolean).join('; ')
            : m.title || '',
          amount: m.payment_amount || 0,
          estimated_days: estimatedDays
        };
      });
    } catch (aiError) {
      logger.error('SOP generation failed, using fallback milestones', aiError);
      usedFallback = true;
      milestones = [
        {
          title: 'Phase 1 - Setup & Planning',
          description: 'Project setup, requirements finalization, architecture planning, and environment configuration.',
          amount: Math.round(totalPrice * 0.2),
          estimated_days: 7
        },
        {
          title: 'Phase 2 - Core Development',
          description: 'Implementation of core features, integration of main components, and iterative development.',
          amount: Math.round(totalPrice * 0.6),
          estimated_days: 21
        },
        {
          title: 'Phase 3 - Testing & Delivery',
          description: 'Quality assurance, bug fixes, documentation, deployment, and final handover.',
          amount: Math.round(totalPrice * 0.2),
          estimated_days: totalDays
        }
      ];
    }

    await db('client_briefs').where({ brief_id: briefId }).update({
      ai_processed: true,
      ai_generated_requirements: JSON.stringify(milestones)
    });

    const result: AIGenerationResult = {
      milestones,
      confidence: usedFallback ? 0.5 : 0.85,
      processing_time: Date.now() - startTime
    };

    logger.info('AI generated milestones from brief', {
      brief_id: briefId,
      project_id: brief.project_id,
      milestones_count: milestones.length
    });

    return result;
  }
}
