import {_mergeRuleOptions, RuleOptions} from '@franzzemen/re-rule';

export interface RuleSetOptions extends RuleOptions {

}

export function _mergeRuleSetOptions(source: RuleSetOptions, target: RuleSetOptions, mergeInto = true): RuleSetOptions {
  return _mergeRuleOptions(source, target, mergeInto);
}
