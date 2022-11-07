import {RuleReference, ScopedReference} from '@franzzemen/re-rule';
import {RuleSet} from './rule-set';
import {ReRuleSet} from './scope/rule-set-execution-context.js';

export const DefaultRuleSetName = 'Default';

export function isRuleSetReference(ref: RuleSet | RuleSetReference): ref is RuleSetReference {
  return 'refName' in ref && 'options' in ref && !('addRule' in ref);
}

export interface RuleSetReference extends ScopedReference {
  options: ReRuleSet;
  rules: RuleReference [];
}
