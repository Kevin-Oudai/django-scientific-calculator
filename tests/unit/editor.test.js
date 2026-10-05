const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/calculator.js');
const editor=core.semanticEditor;
test('semantic AST retains implied operations and evaluated intent independently of display',()=>{
  const ast=editor.parseTokens(editor.tokenize('2pi'));
  assert.equal(ast.operator,'*');assert.equal(ast.implied,true);
  assert.equal(ast.right.name,'pi');
  assert.equal(core.evaluateExpression('2pi','DEG',0),2*Math.PI);
  assert.equal(editor.parseTokens(editor.tokenize('2*pi')).implied,false);
  assert.equal(core.evaluateExpression('2^3^2','DEG',0),512);
  assert.equal(core.evaluateExpression('-2^2','DEG',0),4); // characterized legacy precedence
});
test('token cursor edits atomic functions and preserves immutable editor branches',()=>{
  const original=editor.createEditor(editor.tokenize('sqrt(9)'));
  const first=editor.createEditor(original.tokens,{index:0,offset:0,path:[]});
  const deleted=editor.edit(first,{type:'delete'});
  assert.equal(editor.serialize(deleted.tokens),'(9)');
  assert.equal(editor.serialize(original.tokens),'sqrt(9)');
  const moved=editor.edit(original,{type:'move',direction:-1});
  assert.equal(moved.cursor.index,3);
  const inserted=editor.edit(moved,{type:'insert',token:{kind:'operator',value:'+'}});
  assert.equal(inserted.incomplete,true);
  const numeric=editor.createEditor(editor.tokenize('123'),{index:0,offset:1,path:[]});
  const digit=editor.edit(numeric,{type:'digit',value:'4'});
  assert.equal(editor.serialize(digit.tokens),'1423');
  assert.equal(editor.serialize(editor.edit(digit,{type:'backspace'}).tokens),'123');
});
test('AST and editor reject arbitrary code, unbound variables, excessive depth and wrong arity',()=>{
  for(const text of ['import("x")','A.constructor','<img>','a=2','sqrt(1,2)','1;2'])assert.throws(()=>editor.parseTokens(editor.tokenize(text)),TypeError);
  assert.throws(()=>core.evaluateExpression('A','DEG',0),/Unbound/);
  assert.throws(()=>editor.validateAst({kind:'call',name:'evaluate',args:[]}));
  assert.throws(()=>editor.parseTokens(editor.tokenize('('.repeat(101)+'1'+')'.repeat(101))));
});
test('reducer snapshots preserve semantic cursor and staged template intent',()=>{
  let s=core.createInitialState();for(const key of ['1','2','+','3'])s=core.reduceCalculator(s,{type:'keyboard',key});
  assert.equal(s.editor.ast.operator,'+');
  s=core.reduceCalculator(s,{type:'button',action:'fraction'});
  assert.equal(s.editor.template.type,'fraction');assert.equal(s.editor.cursor.path[0],'template');
  assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
  const fresh=core.reduceCalculator(core.createInitialState(),{type:'token-edit',command:{type:'insert',token:{kind:'number',value:'7'}}});
  assert.equal(fresh.expression,'7');assert.equal(fresh.editor.ast.decimal,'7');
});
