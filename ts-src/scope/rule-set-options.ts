import {_mergeRuleOptions, OptionMergeFunction, RuleOptionOverrides, RuleOptions} from '@franzzemen/re-rule';


export interface RuleSetOptions extends RuleOptions {
  ruleOptionOverrides?: RuleOptionOverrides[];
}

export function _mergeRuleSetOptions(target: RuleSetOptions, source: RuleSetOptions, mergeInto = false): RuleSetOptions {
  const _target: RuleSetOptions = _mergeRuleOptions(target, source, mergeInto);
  _target.ruleOptionOverrides = _mergeRuleOptionOverrides(_target?.ruleOptionOverrides, source.ruleOptionOverrides, _mergeRuleOptions, mergeInto);
  return _target;
}

export function _mergeRuleOptionOverrides(target: RuleOptionOverrides[], source: RuleOptionOverrides[], mergeFunction: OptionMergeFunction, mergeInto = false): RuleOptionOverrides[] {
  let overrides: RuleOptionOverrides[];
  if (source) {
    overrides = [];
    if (target) {
      source.forEach(override => {
        const targetOverride = target.find(item => item.refName = override.refName);
        if (targetOverride) {
          overrides.push({
            refName: override.refName,
            options: mergeFunction(targetOverride.options, override.options, mergeInto)
          });
        } else {
          overrides.push({refName: override.refName, options: mergeFunction({}, override.options, mergeInto)});
        }
      });
    } else {
      source.forEach(override => overrides.push({
        refName: override.refName,
        options: mergeFunction({}, override.options, mergeInto)
      }));
    }
  } else if (target) {
    target.forEach(override => overrides.push({
      refName: override.refName,
      options: mergeFunction({}, override.options, mergeInto)
    }));
  }
  return overrides;
}
