import 'mocha';
import chai from 'chai';
import {RuleSetParser, RuleSetScope, RuleSetStringifier} from '../../publish';

const expect = chai.expect;
const should = chai.should();

const unreachableCode = true;

const parser = new RuleSetParser();
const stringifier = new RuleSetStringifier();
const scope = new RuleSetScope();

describe('Rules Engine Tests', () => {
  describe('Rule Set Stringifier Tests', () => {
    describe ('core/rule-set/stringifier/rule-set/stringifier.test', () => {
      it('should stringify "5 = test"', done => {
        const [remaining, rulesetRef] = parser.parse('<<ru name=Rule1>> 5 = test');
        const stringified = stringifier.stringify(rulesetRef, scope);
        stringified.should.equal('<<rs name=Default>> <<ru name=Rule1>> 5 = test')
        done();
      })
    })
  })
})



