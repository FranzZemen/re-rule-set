import {ExecutionContextI} from '@franzzemen/app-utility';
import {Scope} from '@franzzemen/re-common';
import {RuleScope} from '@franzzemen/re-rule';
import {RuleSetOptions} from './rule-set-options.js';
import {RuleSetParser} from '../parser/rule-set-parser.js';

export class RuleSetScope extends RuleScope {
  static RuleSetParser = 'RuleSetParser';
  constructor(options?: RuleSetOptions, parentScope?: Scope, ec?:ExecutionContextI) {
    super(options, parentScope, ec);
    this.set(RuleSetScope.RuleSetParser, new RuleSetParser());
  }
}
