import {ExecutionContextI, LoggerAdapter} from '@franzzemen/app-utility';
import {RuleElementFactory, RuleElementReference, Scope} from '@franzzemen/re-common';
import {isRule, Rule, RuleOptions, RuleReference, RuleResult} from '@franzzemen/re-rule';
import {isPromise} from 'node:util/types';
import {RuleSetParser} from './parser/rule-set-parser.js';
import {RuleSetReference} from './rule-set-reference.js';
import {RuleSetOptions} from './scope/rule-set-options.js';
import {RuleSetScope} from './scope/rule-set-scope.js';


export interface RuleSetResult {
  valid: boolean;
  ruleSetRef: string;
  ruleResults: RuleResult [];
  ruleSetText: string;
}

export function isRuleSet(ruleSet: RuleSetReference | RuleSet): ruleSet is RuleSet {
  return 'refName' in ruleSet && 'addRule' in ruleSet;
}


export class RuleSet extends RuleElementFactory<Rule> {
  refName: string;
  scope: RuleSetScope;
  options: RuleSetOptions;

  constructor(ref: RuleSetReference, options?: RuleSetOptions, parentScope?: Scope, ec?: ExecutionContextI) {
    super();
    this.refName = ref.refName;
    // TODO: Deep copy
    // TODO: Merge instead?
    if(options) {
      this.options = options;
    } else {
      this.options = ref.options;
    }
    this.scope = new RuleSetScope(this.options, parentScope, ec);
    ref.rules.forEach(ruleRef => {
      this.addRule(ruleRef, ec);
    });
  }

  to(ec?: ExecutionContextI): RuleSetReference {
    /*
    // TODO: Copy options
    const ruleSetRef: RuleSetReference = {refName: this.refName, options: this.options, rules: []};
    this.getRules().forEach(rule => ruleSetRef.rules.push(rule.to(ec)));
    return ruleSetRef;

     */
    return undefined;
  }








  isC(obj: any): obj is Rule {
    return isRule(obj);
  }


  /**
   * We want to proxy the super method in order to add functionality
   */
  register(reference: RuleElementReference<Rule>, ec?:ExecutionContextI): Rule {
    throw new Error('Do not use this method, use addRuleSet instead');
  }

  /**
   * We want to proxy the super method in order to add functionality
   */
  unregister(refName: string, execContext?: ExecutionContextI): boolean {
    throw new Error('Do not use this method, use removeRuleSet instead');
  }

  /**
   * We want to proxy the super method in order to add functionality
   */
  getRegistered(name: string, execContext?: ExecutionContextI): Rule {
    throw new Error('Do not use this method, use getRuleSet instead')
  }

  hasRule(refName: string, execContext?: ExecutionContextI): boolean {
    return super.hasRegistered(refName, execContext);
  }

  addRule(rule: Rule | RuleReference, options?: RuleOptions, ec?: ExecutionContextI) {
    if (this.repo.has(rule.refName)) {
      throw new Error(`Not adding Rule Set to Rules Engine for duplicate refName ${rule.refName}`);
    }
    let theRule: Rule;
    if (isRule(rule)) {
      theRule = rule;
    } else {
      theRule = new Rule(rule, options, this.scope, ec);
    }
    super.register({instanceRef:{refName: theRule.refName, instance: theRule}}, ec);
  }

  getRule(refName: string, execContext?: ExecutionContextI): Rule {
    return super.getRegistered(refName, execContext);
  }

  removeRule(refName: string, execContext?: ExecutionContextI) {
    return super.unregister(refName, execContext);
  }

  getRules(): Rule[] {
    return this.getAllInstances();
  }


  awaitEvaluation(dataDomain: any, ec?: ExecutionContextI): RuleSetResult | Promise<RuleSetResult> {
    const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set', 'validate');
    const ruleResults: RuleResult [] = [];
    const ruleResultPromises: Promise<RuleResult>[] = [];
    let hasPromises = false;
    this.repo.forEach(element => {
      const rule: Rule = element.instanceRef.instance;
      const result = rule.awaitEvaluation(dataDomain, ec);
      if (isPromise(result)) {
        hasPromises = true;
        ruleResults.push(undefined);
        ruleResultPromises.push(result);
      } else {
        ruleResults.push(result);
        ruleResultPromises.push(undefined);
      }
    });
    if (hasPromises) {
      return Promise.all(ruleResultPromises)
        .then(settledPromises => {
          settledPromises.forEach((settled, index) => {
            if (settled !== undefined) {
              ruleResults[index] = settled;
            }
          });
          return {
            ruleSetRef: this.refName,
            ruleSetText: '',
            ruleResults: ruleResults,
            valid: ruleResults.every(result => result.valid === true)
          };
        });
    } else {
      return {
        ruleSetRef: this.refName,
        ruleSetText: '',
        ruleResults: ruleResults,
        valid: ruleResults.every(result => result.valid === true)
      };
    }
  }

  static awaitRuleSetExecution(dataDomain: any, ruleSet: string | RuleSetReference | RuleSet, options?: RuleOptions, parentScope?: Scope, ec?: ExecutionContextI): RuleSetResult | Promise<RuleSetResult> {
    let theRuleSet: RuleSet;
    if(typeof ruleSet === 'string') {
      const parser = new RuleSetParser();
      let [remaining, ref] = parser.parse(ruleSet, parentScope, ec);
      theRuleSet = new RuleSet(ref, options, parentScope, ec);
    } else if(isRuleSet(ruleSet)) {
      theRuleSet = ruleSet;
    } else {
      theRuleSet = new RuleSet(ruleSet, options, parentScope, ec);
    }
    return theRuleSet.awaitEvaluation(dataDomain, ec);
  }



  awaitRuleExecution(dataDomain: any, ruleName: string, ec?: ExecutionContextI): RuleResult | Promise<RuleResult> {
    const rule = this.getRule(ruleName, ec);
    if(rule) {
      return rule.awaitEvaluation(dataDomain, ec);
    } else {
      const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set', 'awaitRuleExecution');
      const err = new Error(`Rule for rule name "${ruleName}" not found`);
      log.error(err);
      throw(err);
    }
  }

}
