import {ExecutionContextI} from '@franzzemen/app-utility';
import {RuleStringifier} from '@franzzemen/re-rule';

import {RuleSetReference} from '../rule-set-reference';
import {RuleSetScope} from '../scope/rule-set-scope';
import {RuleSetHintKey} from '../util/rule-set-hint-key';
import {StringifyRuleSetOptions} from './stringify-rule-set-options';

export class RuleSetStringifier {
  constructor() {
  }

  stringify(ruleSetRef: RuleSetReference, scope: RuleSetScope, options?: StringifyRuleSetOptions, ec?: ExecutionContextI) {
    let stringified: string;
    // TODO stringify options
    if(ruleSetRef.refName.indexOf(' ') < 0) {
      stringified = `<<${RuleSetHintKey.RuleSet} name=${ruleSetRef.refName}>>`;
    } else {
      stringified = `<<${RuleSetHintKey.RuleSet} name="${ruleSetRef.refName}">>`;
    }
    const ruleStringifier = new RuleStringifier();
    ruleSetRef.rules.forEach(rule => {
      stringified += ` ${ruleStringifier.stringify(rule, scope, options, ec)}`;
    });
    return stringified;
  }
}
