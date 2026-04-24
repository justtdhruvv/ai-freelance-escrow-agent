export interface PFIEvent {
  type: string;
  delta: number;
  project_id: string;
  applied: boolean;
  calculation_breakdown: string;
}

const PFI_DELTAS: Record<string, number> = {
  aqa_pass: 15,
  aqa_fail: -20,
  deadline_met: 10,
  deadline_missed: -15,
  dispute_won: 25,
  dispute_lost: -30,
  revision_requested: -5
};

export function calculatePFIEvents(
  aqaResult: { verdict: string; pass_rate: number; milestone_amount: number },
  projectContext: { project_id: string; grace_period_active?: boolean; deadline?: string; submission_time?: string }
): PFIEvent[] {
  const events: PFIEvent[] = [];
  const { verdict, pass_rate = 0, milestone_amount = 0 } = aqaResult;
  const { project_id = '', grace_period_active = false, deadline, submission_time } = projectContext;
  const applied = !grace_period_active;

  let sizeMultiplier: number;
  if (milestone_amount <= 10000) sizeMultiplier = 0.8;
  else if (milestone_amount <= 50000) sizeMultiplier = 1.0;
  else if (milestone_amount <= 100000) sizeMultiplier = 1.2;
  else sizeMultiplier = 1.5;

  let base: number;
  let finalDelta: number;

  if (verdict === 'passed') {
    base = PFI_DELTAS.aqa_pass;
    finalDelta = Math.round(base * sizeMultiplier);
  } else if (verdict === 'partial') {
    if (pass_rate >= 0.8) {
      base = PFI_DELTAS.aqa_pass;
      finalDelta = Math.round(base * pass_rate * sizeMultiplier);
    } else {
      base = PFI_DELTAS.aqa_fail;
      finalDelta = Math.round(base * (1 - pass_rate) * sizeMultiplier);
    }
  } else {
    base = PFI_DELTAS.aqa_fail;
    finalDelta = Math.round(base * sizeMultiplier);
  }

  const isPositive = verdict === 'passed' || (verdict === 'partial' && pass_rate >= 0.8);
  const breakdown = `Base: ${base} × pass_rate: ${Math.round(pass_rate * 100)}% × size: ${sizeMultiplier}x = ${finalDelta}`;

  events.push({
    type: isPositive ? 'aqa_pass' : 'aqa_fail',
    delta: finalDelta,
    project_id,
    applied,
    calculation_breakdown: breakdown
  });

  if (deadline && submission_time) {
    try {
      const toDate = (s: string) => {
        let clean = s;
        if (!clean.endsWith('Z') && !clean.includes('+') && !clean.endsWith('+00:00')) {
          clean = clean + 'Z';
        }
        return new Date(clean.replace('Z', '+00:00'));
      };

      const deadlineDt = toDate(deadline);
      const submissionDt = toDate(submission_time);
      const onTime = submissionDt <= deadlineDt;
      const deadlineType = onTime ? 'deadline_met' : 'deadline_missed';
      const delta = PFI_DELTAS[deadlineType];

      events.push({
        type: deadlineType,
        delta,
        project_id,
        applied,
        calculation_breakdown: `Deadline ${onTime ? 'met' : 'missed'}: flat ${delta} points`
      });
    } catch {
      // skip deadline event if parsing fails
    }
  }

  return events;
}
