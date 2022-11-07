import {LogExecutionContext} from '@franzzemen/logger-adapter';
import {Scope} from '@franzzemen/re-common';
import {RuleScope} from '@franzzemen/re-rule';
import {ReRuleSet, RuleSetOptions} from './rule-set-execution-context.js';
import {RuleSetParser} from '../parser/rule-set-parser.js';

export class RuleSetScope extends RuleScope {
  static RuleSetParser = 'RuleSetParser';
  constructor(options?: ReRuleSet, parentScope?: Scope, ec?:LogExecutionContext) {
    super(options, parentScope, ec);
    this.set(RuleSetScope.RuleSetParser, new RuleSetParser());
  }

  get options(): ReRuleSet {
    return this._options;
  }
}
