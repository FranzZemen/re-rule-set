import 'mocha';
import chai from 'chai';
import {RuleSetParser, RuleSetStringifier} from '../../publish/index.js';

const expect = chai.expect;
const should = chai.should();

const unreachableCode = true;

const parser = new RuleSetParser();
const stringifier = new RuleSetStringifier();

describe('Rules Engine Tests', () => {
  describe('Rule Set Stringifier Tests', () => {
    describe ('core/rule-set/stringifier/rule-set/stringifier.test', () => {
      it('should stringify "5 = test"', done => {
        const [remaining, rulesetRef] = parser.parse('<<ru name=Rule1>> 5 = test');
        const stringified = stringifier.stringify(rulesetRef, rulesetRef.loadedScope);
        stringified.should.equal('<<rs name=Default>> <<ru name=Rule1>> 5 = test')
        done();
      })
    })
  })
})



