import { evaluateRule, type Rule, type RuleContext } from '../rules/engine.js';

export type FormConditionSet = {
  showIf?: Rule;
  requiredIf?: Rule;
  enabledIf?: Rule;
};

export type FormEvaluationContext = RuleContext & {
  answers?: Record<string, unknown>;
};

export type FieldBehavior = {
  visible: boolean;
  required: boolean;
  enabled: boolean;
};

function enrichContext(context: FormEvaluationContext): RuleContext {
  const query = { ...(context.query ?? {}) };
  for (const [key, value] of Object.entries(context.answers ?? {})) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value == null
    ) {
      query[`answer.${key}`] = value;
    }
  }

  const result: RuleContext = { query };
  if (context.userId !== undefined) {
    result.userId = context.userId;
  }
  if (context.sessionId !== undefined) {
    result.sessionId = context.sessionId;
  }
  if (context.segments !== undefined) {
    result.segments = context.segments;
  }
  if (context.country !== undefined) {
    result.country = context.country;
  }
  if (context.device !== undefined) {
    result.device = context.device;
  }
  if (context.referrer !== undefined) {
    result.referrer = context.referrer;
  }
  return result;
}

export function evaluateFieldConditions(
  conditions: FormConditionSet | null | undefined,
  context: FormEvaluationContext
): FieldBehavior {
  const evalContext = enrichContext(context);
  const visible = conditions?.showIf ? evaluateRule(conditions.showIf, evalContext) : true;
  const enabled = visible && (conditions?.enabledIf ? evaluateRule(conditions.enabledIf, evalContext) : true);
  const required = visible && (conditions?.requiredIf ? evaluateRule(conditions.requiredIf, evalContext) : false);

  return { visible, required, enabled };
}
