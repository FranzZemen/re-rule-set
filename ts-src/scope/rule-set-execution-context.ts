import {AppExecutionContextDefaults, appSchemaWrapper} from '@franzzemen/app-execution-context';
import {ExecutionContextDefaults, executionSchemaWrapper} from '@franzzemen/execution-context';
import {LogExecutionContextDefaults, logSchemaWrapper} from '@franzzemen/logger-adapter';
import {CommonExecutionContextDefaults, commonOptionsSchemaWrapper} from '@franzzemen/re-common';
import {ConditionExecutionContextDefaults, conditionOptionsSchemaWrapper} from '@franzzemen/re-condition';
import {DataTypeExecutionContextDefaults, dataTypeOptionsSchemaWrapper} from '@franzzemen/re-data-type';
import {ExpressionExecutionContextDefaults, expressionOptionsSchemaWrapper} from '@franzzemen/re-expression';
import {
  LogicalConditionExecutionContextDefaults,
  logicalConditionOptionsSchemaWrapper
} from '@franzzemen/re-logical-condition';
import {
  ReRule,
  reRuleSchemaWrapper,
  RuleExecutionContext, RuleExecutionContextDefaults,
  RuleOptionOverrides,
  ruleOptionsSchemaWrapper
} from '@franzzemen/re-rule';
import Validator, {ValidationError} from 'fastest-validator';
import {isPromise} from 'util/types';


export interface RuleSetOptions {
  ruleOptionOverrides?: RuleOptionOverrides[];
}


export interface ReRuleSet extends ReRule {
  're-rule-set'?: RuleSetOptions;
}

export interface RuleSetExecutionContext extends RuleExecutionContext {
  re?: ReRuleSet;
}

export class RuleSetExecutionContextDefaults {
  static RuleSetOptions: RuleSetOptions = {};
  static ReRuleSet: ReRuleSet = {
    're-common': CommonExecutionContextDefaults.CommonOptions,
    're-data-type': DataTypeExecutionContextDefaults.DataTypeOptions,
    're-expression': ExpressionExecutionContextDefaults.ExpressionOptions,
    're-condition': ConditionExecutionContextDefaults.ConditionOptions,
    're-logical-condition': LogicalConditionExecutionContextDefaults.LogicalConditionOptions,
    're-rule': RuleExecutionContextDefaults.RuleOptions,
    're-rule-set': RuleSetExecutionContextDefaults.RuleSetOptions
  };
  static RuleSetExecutionContext: RuleSetExecutionContext = {
    execution: ExecutionContextDefaults.Execution(),
    app: AppExecutionContextDefaults.App,
    log: LogExecutionContextDefaults.Log,
    re: RuleSetExecutionContextDefaults.ReRuleSet
  };
}

export const ruleOptionOverrideSchema = {
  refName: {type: 'string', optional: false},
  options: reRuleSchemaWrapper
};

export const ruleOptionOverrideSchemaWrapper = {
  type: 'object',
  props: ruleOptionOverrideSchema
};

export const ruleSetOptionsSchema = {
  ruleOptionOverrides: {type: 'array', optional: true, items: ruleOptionOverrideSchemaWrapper}
};

export const ruleSetOptionsSchemaWrapper = {
  type: 'object',
  optional: true,
  default: RuleSetExecutionContextDefaults.RuleSetOptions,
  props: ruleSetOptionsSchema
};

const reRuleSetSchema = {
  're-common': commonOptionsSchemaWrapper,
  're-data-type': dataTypeOptionsSchemaWrapper,
  're-expression': expressionOptionsSchemaWrapper,
  're-condition': conditionOptionsSchemaWrapper,
  're-logical-condition': logicalConditionOptionsSchemaWrapper,
  're-rule': ruleOptionsSchemaWrapper,
  're-rule-set': ruleSetOptionsSchemaWrapper
};

export const reRuleSetSchemaWrapper = {
  type: 'object',
  optional: true,
  default: RuleSetExecutionContextDefaults.ReRuleSet,
  props: reRuleSetSchema
};


export const ruleSetExecutionContextSchema = {
  execution: executionSchemaWrapper,
  app: appSchemaWrapper,
  log: logSchemaWrapper,
  re: reRuleSetSchemaWrapper
};

export const ruleSetExecutionContextSchemaWrapper = {
  type: 'object',
  optional: true,
  default: RuleSetExecutionContextDefaults.RuleSetExecutionContext,
  props: ruleSetExecutionContextSchema
};


export function isRuleSetExecutionContext(options: any | RuleSetExecutionContext): options is RuleSetExecutionContext {
  return options && 're' in options; // Faster than validate
}

const check = (new Validator({useNewCustomCheckerFunction: true})).compile(ruleSetExecutionContextSchema);

export function validate(context: RuleSetExecutionContext): true | ValidationError[] {
  const result = check(context);
  if (isPromise(result)) {
    throw new Error('Unexpected asynchronous on RuleSetExecutionContext validation');
  } else {
    if (result === true) {
      context.validated = true;
    }
    return result;
  }
}


