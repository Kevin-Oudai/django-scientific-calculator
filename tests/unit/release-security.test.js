const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const core=require(root+'core'),semantic=require(root+'semantic-editor'),engine=require(root+'math-engine');
test('Canonical input rejects executable text and unavailable engine entry points',()=>{
 for(const source of ['import("x")','evaluate("1")','constructor.constructor("return globalThis")()','x=1','[1,2]','<script>alert(1)</script>'])assert.throws(()=>semantic.parseTokens(semantic.tokenize(source)));
 const api=engine.createEngine();for(const name of ['import','evaluate','parse','compile','createUnit'])assert.equal(api[name],undefined);
 assert.equal(Object.isFrozen(api),true);
});
test('AST validation bounds shared expansion, cycles, depth and numeric text before evaluation',()=>{
 const number={kind:'number',decimal:'1'};let shared=number;
 for(let i=0;i<14;i++)shared={kind:'binary',operator:'+',implied:false,left:shared,right:shared};
 assert.throws(()=>semantic.validateAst(shared),/Invalid AST/);
 const cycle={kind:'unary',operator:'+',operand:null};cycle.operand=cycle;assert.throws(()=>semantic.validateAst(cycle),/Invalid AST/);
 assert.throws(()=>semantic.validateAst({kind:'number',decimal:'1'.repeat(1101)}));
 let called=false;assert.throws(()=>semantic.evaluate(shared,{number:()=>{called=true;return 1;}}));assert.equal(called,false);
 assert.equal(core.evaluateExpression('2+3','DEG',0),5);
});
test('Snapshot restore rejects huge collections and accessors before cloning or reading them',()=>{
 let read=false;const hostile={};Object.defineProperty(hostile,'state',{get(){read=true;return {};},enumerable:true});assert.throws(()=>core.restoreCalculator(hostile));assert.equal(read,false);
 const snapshot=core.snapshotCalculator(core.createInitialState());assert.deepEqual(core.restoreCalculator(snapshot),snapshot.state);
 snapshot.state.history=Array(10002).fill('1');assert.throws(()=>core.restoreCalculator(snapshot),/collection limit/);
 const long=core.snapshotCalculator(core.createInitialState());long.state.expression='1'.repeat(10001);assert.throws(()=>core.restoreCalculator(long),/text limit/);
});
