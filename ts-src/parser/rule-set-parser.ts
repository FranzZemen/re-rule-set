import {ExecutionContextI, Hints, LoggerAdapter} from '@franzzemen/app-utility';
import {Scope} from '@franzzemen/re-common';
import {RuleContainerParser, RuleParser, RuleReference} from '@franzzemen/re-rule';
import {RuleSet} from '../rule-set';
import {RuleSetReference} from '../rule-set-reference';
import {RuleSetOptions} from '../scope/rule-set-options';
import {RuleSetScope} from '../scope/rule-set-scope';
import {RuleSetHintKey} from '../util/rule-set-hint-key';

export class RuleSetParser extends RuleContainerParser<RuleSetReference> {

  constructor() {
    super(RuleSetHintKey.RuleSet, [RuleSetHintKey.RulesEngine, RuleSetHintKey.Application]);
  }

  protected createScope(options?: RuleSetOptions, parentScope?: Scope, ec?: ExecutionContextI): Scope {
    return new RuleSetScope(options, parentScope, ec);
  }

  protected createReference(refName: string, options: RuleSetOptions): RuleSetReference {
    return {refName, options, rules: []};
  }

  protected delegateParsing(ruleSetRef: RuleSetReference, near: string, scope: RuleSetScope, ec?: ExecutionContextI): string {
    const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set-parser', 'delegateParsing');
    let remaining = near;

    // Consume the remaining text as long as rule sets are returned.
    while(remaining.length > 0) {
      const parser: RuleParser = new RuleParser();
      let rule: RuleReference;
      [remaining, rule] = parser.parse(remaining, scope, ec);

      if(rule) {
        ruleSetRef.rules.push(rule);
      }
      const hints = Hints.peekHints(remaining, '', ec);
      if(hints?.has(RuleSetHintKey.RulesEngine)) {
        const err = new Error(`Unexpected rules engine block near "${near}" and before "${remaining}"`);
        log.error(err);
        throw err;
      } else if (hints?.has(RuleSetHintKey.Application) || hints?.has(RuleSetHintKey.RuleSet)) {
        break;
      }
    }
    return remaining;
  }
}
