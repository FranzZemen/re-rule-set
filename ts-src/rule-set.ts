import {ExecutionContextI, LoggerAdapter} from '@franzzemen/app-utility';
import {
  isPromise,
  RuleElementFactory,
  RuleElementInstanceReference,
  RuleElementModuleReference,
  Scope
} from '@franzzemen/re-common';
import {isRule, Rule, RuleReference, RuleResult} from '@franzzemen/re-rule';
import {RuleSetParser} from './parser/rule-set-parser';
import {isRuleSetReference, RuleSetReference} from './rule-set-reference';
import {RuleSetOptions} from './scope/rule-set-options';
import {RuleSetScope} from './scope/rule-set-scope';


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

  constructor(ruleSet: RuleSetReference | RuleSet, parentScope?: Scope, ec?: ExecutionContextI) {
    super();
    RuleSet.fromToInstance(this, ruleSet, parentScope, ec);
  }

  to(ec?: ExecutionContextI): RuleSetReference {
    // TODO: Copy options
    const ruleSetRef: RuleSetReference = {refName: this.refName, options: this.options, rules: []};
    this.getRules().forEach(rule => ruleSetRef.rules.push(rule.to(ec)));
    return ruleSetRef;
  }


  private static from(ref: RuleSet | RuleSetReference, parentScope?:Scope, ec?: ExecutionContextI): RuleSet {
    return new RuleSet(ref, parentScope, ec);
  }


  private static fromToInstance(instance: RuleSet, ref: RuleSet | RuleSetReference, parentScope?:Scope, ec?: ExecutionContextI) {
    if(ref) {
      if(isRuleSetReference(ref)) {
        RuleSet.fromReference(instance, ref, parentScope, ec);
      } else {
        RuleSet.fromCopy(instance, ref, parentScope, ec);
      }
    } else {
      throw new Error('Undefined ref');
    }
  }

  private static fromReference(instance: RuleSet, ruleSetRef: RuleSetReference, parentScope?: Scope, ec?: ExecutionContextI) {
    if(ruleSetRef) {
      instance.refName = ruleSetRef.refName;
      // TODO: Deep copy
      instance.options = ruleSetRef.options;
      instance.scope = new RuleSetScope(instance.options, parentScope, ec);
      ruleSetRef.rules.forEach(ruleRef => {
        instance.addRule(ruleRef, ec);
      });
    } else {
      throw new Error('Undefined ruleSetRef');
    }
  }

  private static fromCopy(instance: RuleSet, copy: RuleSet, parentScope?: Scope, ec?: ExecutionContextI) {
    if(copy) {
      instance.refName = copy.refName;
      // TODO: Deep copy options
      instance.options = copy.options;
      instance.scope = new RuleSetScope(instance.options, parentScope, ec);
      copy.repo.forEach(elem => {
        instance.addRule(elem.instanceRef.instance, ec);
      });
    } else {
      throw new Error('Undefined rule');
    }
  }



  isC(obj: any): obj is Rule {
    return isRule(obj);
  }


  /**
   * We want to proxy the super method in order to add functionality
   */
  register(reference: RuleElementModuleReference | RuleElementInstanceReference<Rule>, override?: boolean, execContext?: ExecutionContextI, ...params): Rule {
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

  addRule(rule: Rule | RuleReference, ec?: ExecutionContextI) {
    if (this.repo.has(rule.refName)) {
      throw new Error(`Not adding Rule Set to Rules Engine for duplicate refName ${rule.refName}`);
    }
    let theRule: Rule;
    if (isRule(rule)) {
      theRule = rule;
    } else {
      theRule = new Rule(rule, this.scope, ec);
    }
    super.register({refName: theRule.refName, instance: theRule});
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

  awaitExecution(dataDomain: any, ec?: ExecutionContextI): RuleSetResult | Promise<RuleSetResult> {
    return this.validate(dataDomain, ec);
  }

  executeSync(dataDomain: any, ec?: ExecutionContextI): RuleSetResult {
    const result = this.awaitExecution(dataDomain, ec);
    if(isPromise(result)) {
      const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set', 'executeSync');
      const err = new Error('Promise returned in executeSync');
      log.error(err);
      throw(err);
    } else {
      return result;
    }
  }

  /**
   * @deprecated
   * @param dataDomain
   * @param ec
   */
  validate(dataDomain: any, ec?: ExecutionContextI): RuleSetResult | Promise<RuleSetResult> {
    const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set', 'validate');
    const ruleResults: RuleResult [] = [];
    const ruleResultPromises: Promise<RuleResult>[] = [];
    let hasPromises = false;
    this.repo.forEach(element => {
      const rule: Rule = element.instanceRef.instance;
      const result = rule.awaitValidation(dataDomain, ec);
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

  static awaitRuleSetExecution(dataDomain: any, ruleSet: string | RuleSetReference | RuleSet, parentScope?: Scope, ec?: ExecutionContextI): RuleSetResult | Promise<RuleSetResult> {
    let theRuleSet: RuleSet;
    if(typeof ruleSet === 'string') {
      const parser = new RuleSetParser();
      let [remaining, ref] = parser.parse(ruleSet, parentScope, ec);
      theRuleSet = new RuleSet(ref, parentScope, ec);
    } else if(isRuleSet(ruleSet)) {
      theRuleSet = ruleSet;
    } else {
      theRuleSet = new RuleSet(ruleSet, parentScope, ec);
    }
    return theRuleSet.awaitExecution(dataDomain, ec);
  }

  static executeRuleSetSync(dataDomain: any, ruleSet: string | RuleSetReference | RuleSet, parentScope?: Scope, ec?: ExecutionContextI): RuleSetResult {
    let theRuleSet: RuleSet;
    if(typeof ruleSet === 'string') {
      const parser = new RuleSetParser();
      let [remaining, ref] = parser.parse(ruleSet, parentScope, ec);
      theRuleSet = new RuleSet(ref, parentScope, ec);
    } else if(isRuleSet(ruleSet)) {
      theRuleSet = ruleSet;
    } else {
      theRuleSet = new RuleSet(ruleSet, parentScope, ec);
    }
    return theRuleSet.executeSync(dataDomain, ec);
  }

  awaitRuleExecution(dataDomain: any, ruleName: string, ec?: ExecutionContextI): RuleResult | Promise<RuleResult> {
    const rule = this.getRule(ruleName, ec);
    if(rule) {
      return rule.awaitExecution(dataDomain, ec);
    } else {
      const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set', 'awaitRuleExecution');
      const err = new Error(`Rule for rule name "${ruleName}" not found`);
      log.error(err);
      throw(err);
    }
  }

  executeRuleSync(dataDomain: any, ruleName: string, ec?: ExecutionContextI): RuleResult {
    const rule = this.getRule(ruleName, ec);
    if(rule) {
      return rule.executeSync(dataDomain, ec);
    } else {
      const log = new LoggerAdapter(ec, 'rules-engine', 'rule-set', 'awaitRuleExecution');
      const err = new Error(`Rule for rule name "${ruleName}" not found`);
      log.error(err);
      throw(err);
    }
  }
}
