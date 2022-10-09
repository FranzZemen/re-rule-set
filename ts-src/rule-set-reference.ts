import {NamedReference} from '@franzzemen/re-common';
import {RuleReference, ScopedReference} from '@franzzemen/re-rule';
import {RuleSet} from './rule-set';
import {RuleSetOptions} from './scope/rule-set-options';

export const DefaultRuleSetName = 'Default';

export function isRuleSetReference(ref: RuleSet | RuleSetReference): ref is RuleSetReference {
  return 'refName' in ref && 'options' in ref && !('addRule' in ref);
}

export interface RuleSetReference extends ScopedReference {
  options: RuleSetOptions;
  rules: RuleReference [];
}
