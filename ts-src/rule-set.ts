import _ from 'lodash';
import {logErrorAndThrow} from '@franzzemen/enhanced-error';
import {LogExecutionContext, LoggerAdapter} from '@franzzemen/logger-adapter';
import {RuleElementFactory, RuleElementReference} from '@franzzemen/re-common';
import {
  isRule,
  Rule,
  RuleOptionOverrides,
  RuleOptions,
  RuleResult,
  RuleScope
} from '@franzzemen/re-rule';
import {isPromise} from 'node:util/types';
import {RuleSetParser} from './parser/rule-set-parser.js';
import {RuleSetReference} from './rule-set-reference.js';
import {ReRuleSet, RuleSetOptions} from './scope/rule-set-execution-context.js';
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

  constructor(ref: RuleSetReference, thisScope?: RuleSetScope, ec?: LogExecutionContext) {
    super();
    this.refName = ref.refName;
    // Which scope?
    this.scope = ref.loadedScope ? ref.loadedScope : thisScope ? thisScope : undefined;
    if(!this.scope) {
      logErrorAndThrow(`Scope not provided for refName ${ref.refName}`, new LoggerAdapter(ec, 're-rule-set', 'rule-set', 'constructor'));
    }
    ref.rules.forEach(ruleRef => {
      // ref may have a loaded scope - if it does it overrides everything as all scope merging should happen during load or parsing
      let rule: Rule;
      if(!ref.loadedScope) {
        let reRuleSet: ReRuleSet = _.merge({}, this.scope.options);
        let reRuleSetForOverrides: ReRuleSet = this.scope.options;
        // Need to create ruleScope from options and overrides
        const ruleOptionOverrides:RuleOptionOverrides[] = reRuleSetForOverrides.ruleset.ruleOptionOverrides;
        const override: RuleOptions = ruleOptionOverrides.find(item => item.refName === ruleRef.refName)?.options;
        if(override) {
          reRuleSet = _.merge(reRuleSet, override);
        }
        const ruleScope = new RuleScope(reRuleSet, this.scope, ec);
        rule = new Rule(ruleRef, ruleScope, ec);
      } else {
        rule = new Rule(ruleRef, undefined, ec);
      }
      this.addRule(rule, ec);
    });
  }

  to(ec?: LogExecutionContext): RuleSetReference {
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
  register(reference: RuleElementReference<Rule>, ec?:LogExecutionContext): Rule {
    throw new Error('Do not use this method, use addRuleSet instead');
  }

  /**
   * We want to proxy the super method in order to add functionality
   */
  unregister(refName: string, execContext?: LogExecutionContext): boolean {
    throw new Error('Do not use this method, use removeRuleSet instead');
  }

  /**
   * We want to proxy the super method in order to add functionality
   */
  getRegistered(name: string, execContext?: LogExecutionContext): Rule {
    throw new Error('Do not use this method, use getRuleSet instead')
  }

  hasRule(refName: string, execContext?: LogExecutionContext): boolean {
    return super.hasRegistered(refName, execContext);
  }

  addRule(rule: Rule, ec?: LogExecutionContext) {
    if (this.repo.has(rule.refName)) {
      throw new Error(`Not adding Rule Set to Rules Engine for duplicate refName ${rule.refName}`);
    }
    rule.scope.reParent(this.scope, ec);
    super.register({instanceRef:{refName: rule.refName, instance: rule}}, ec);
  }

  getRule(refName: string, execContext?: LogExecutionContext): Rule {
    return super.getRegistered(refName, execContext);
  }

  removeRule(refName: string, ec?: LogExecutionContext) {
    const rule: Rule = super.getRegistered(refName, ec);
    rule.scope.removeParent(ec);
    return super.unregister(refName, ec);
  }

  getRules(): Rule[] {
    return this.getAllInstances();
  }


  awaitEvaluation(dataDomain: any, ec?: LogExecutionContext): RuleSetResult | Promise<RuleSetResult> {
    const log = new LoggerAdapter(ec, 're-rule-set', 'rule-set', 'awaitEvaluation');
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

  /**
   *
   * @param dataDomain
   * @param text The ruleset text.  If options are needed they should be provided in the hints for ruleset or rules
   * @param options
   * @param ec
   */
  static awaitExecution(dataDomain: any, text: string, options?: ReRuleSet, ec?: LogExecutionContext): RuleSetResult | Promise<RuleSetResult> {
    const parser = new RuleSetParser();
    let [remaining, ref, parserMessages] = parser.parse(text, {options}, undefined, ec);
    let trueOrPromise = RuleSetScope.resolve(ref.loadedScope, ec);
    if(isPromise(trueOrPromise)) {
      return trueOrPromise
        .then(trueVale => {
          const ruleSet = new RuleSet(ref, undefined, ec);
          return ruleSet.awaitEvaluation(dataDomain,ec);
        })
    } else {
      const ruleSet = new RuleSet(ref, undefined, ec);
      return ruleSet.awaitEvaluation(dataDomain,ec);
    }
  }
}
