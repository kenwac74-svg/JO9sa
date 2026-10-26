'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const qa=require('./release-check.cjs');
test('client timing keeps the existing default and budgets all completion probes',()=>{
 assert.equal(typeof qa.clientRunnerTiming,'function');
 assert.deepEqual(qa.clientRunnerTiming(undefined,9),{timeoutSeconds:12,runnerTimeoutMs:120000});
 assert.deepEqual(qa.clientRunnerTiming('30',9),{timeoutSeconds:30,runnerTimeoutMs:282000});
 assert.deepEqual(qa.clientRunnerTiming('30',1),{timeoutSeconds:30,runnerTimeoutMs:42000});
});
test('explicit client timeout is bounded and validated before running checks',()=>{
 assert.equal(qa.parseArgs(['--candidate','test.qsp','--client-timeout-seconds','30'])['client-timeout-seconds'],'30');
 for(const value of ['0','61','NaN','1.5','-1'])assert.throws(()=>qa.parseArgs(['--candidate','test.qsp','--client-timeout-seconds',value]),/timeout/i);
 assert.throws(()=>qa.clientRunnerTiming('30',0),/probe/i);
});
