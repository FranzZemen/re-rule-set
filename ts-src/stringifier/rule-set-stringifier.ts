import {LogExecutionContext} from '@franzzemen/logger-adapter';
import {RuleStringifier} from '@franzzemen/re-rule';

import {RuleSetReference} from '../rule-set-reference.js';
import {RuleSetScope} from '../scope/rule-set-scope.js';
import {RuleSetHintKey} from '../util/rule-set-hint-key.js';
import {StringifyRuleSetOptions} from './stringify-rule-set-options.js';

export class RuleSetStringifier {
  constructor() {
  }

  stringify(ruleSetRef: RuleSetReference, scope: RuleSetScope, options?: StringifyRuleSetOptions, ec?: LogExecutionContext) {
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
