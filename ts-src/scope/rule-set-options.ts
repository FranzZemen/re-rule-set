import {_mergeRuleOptions, RuleOptionOverrides, RuleOptions} from '@franzzemen/re-rule';



export interface RuleSetOptions extends RuleOptions {
  ruleOptionOverrides?: RuleOptionOverrides[];
}

export function _mergeRuleSetOptions(target: RuleSetOptions, source: RuleSetOptions, mergeInto = true): RuleSetOptions {
  const _target: RuleSetOptions = _mergeRuleOptions(target, source, mergeInto);
  if(_target === target) {
    if(source.ruleOptionOverrides) {
      if(_target.ruleOptionOverrides) {
        source.ruleOptionOverrides.forEach(override => {
          const ndx = _target.ruleOptionOverrides.findIndex(targetOverride => targetOverride.refName === override.refName);
          if(ndx >= 0) {
            target.ruleOptionOverrides[ndx] = override;
          } else {
            target.ruleOptionOverrides.push(override);
          }
        })
      } else {
        _target.ruleOptionOverrides = [];
        source.ruleOptionOverrides.forEach(override => _target.ruleOptionOverrides.push(override));
      }
    }
  }
  return _target;
}
