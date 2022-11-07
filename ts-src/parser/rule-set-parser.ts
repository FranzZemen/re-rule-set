import {Hints} from '@franzzemen/hints';
import {LogExecutionContext, LoggerAdapter} from '@franzzemen/logger-adapter';
import {ParserMessages, Scope} from '@franzzemen/re-common';
import {
  DelegateOptions,
  RuleContainerParser,
  RuleParser,
  RuleReference,
  RuleScope
} from '@franzzemen/re-rule';
import {RuleSetReference} from '../rule-set-reference.js';
import {ReRuleSet, RuleSetOptions} from '../scope/rule-set-execution-context.js';
import {RuleSetScope} from '../scope/rule-set-scope.js';
import {RuleSetHintKey} from '../util/rule-set-hint-key.js';

export class RuleSetParser extends RuleContainerParser<RuleSetReference> {

  constructor() {
    super(RuleSetHintKey.RuleSet, [RuleSetHintKey.RulesEngine, RuleSetHintKey.Application]);
  }

  protected createReference(refName: string, options: ReRuleSet): RuleSetReference {
    return {refName, options, rules: []};
  }

  protected delegateParsing(ruleSetRef: RuleSetReference, near: string, scope: RuleSetScope, ec?: LogExecutionContext): [string, ParserMessages] {
    const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set-parser', 'delegateParsing');
    let remaining = near;

    // Consume the remaining text as long as rule sets are returned.
    while(remaining.length > 0) {
      const parser: RuleParser = new RuleParser();
      let ruleRef: RuleReference, ruleScope: RuleScope, parserMessages: ParserMessages;
      // Although scope at this level (RuleSet) has digested options, including RulesOptions, there could be overrides for rules
      let delegateOptions: DelegateOptions;
      let overrides = (scope?.options as RuleSetOptions)?.ruleOptionOverrides;
      if(overrides && overrides.length > 0) {
        delegateOptions = {overrides: overrides}
      }
      [remaining, ruleRef, parserMessages] = parser.parse(remaining, delegateOptions, scope, ec);
      if(ruleRef) {
        ruleSetRef.rules.push(ruleRef);
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
    // TODO: Merge parser messages
    return [remaining, undefined];
  }

  protected createScope(options: ReRuleSet | undefined, parentScope: Scope | undefined, ec: LogExecutionContext | undefined): RuleSetScope {
    return new RuleSetScope(options, parentScope, ec);
  }
}
