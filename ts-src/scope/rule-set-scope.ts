import {ExecutionContextI} from '@franzzemen/app-utility';
import {Scope} from '@franzzemen/re-common';
import {RuleScope} from '@franzzemen/re-rule';
import {RuleSetOptions} from './rule-set-options.js';

export class RuleSetScope extends RuleScope {
  constructor(options?: RuleSetOptions, parentScope?: Scope, ec?:ExecutionContextI) {
    super(options, parentScope, ec);
  }
}
