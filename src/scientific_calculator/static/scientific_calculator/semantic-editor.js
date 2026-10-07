(function (host, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports && typeof document === 'undefined') module.exports = api;
  else host.ScientificCalculatorSemantic = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const functions = Object.freeze(['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','asinh','acosh','atanh','sqrt','cbrt','log','ln','tenpow','epow','recip','abs','pct','fact','root','ncr','npr','dms','frac','kilo','mega','giga','tera','milli','micro','nano','pico','femto','cv','random','dice','coin','rint']);
  const symbols = Object.freeze(['pi','e','ans','A','B','C','D','E','F','X','Y','M']);
  function validateToken(t) {
    if (!t || Object.keys(t).sort().join() !== 'kind,value' || typeof t.value !== 'string') throw new TypeError('Invalid semantic token');
    if (t.kind === 'number' && /^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d{1,2})?$/.test(t.value)) return;
    if (t.kind === 'function' && functions.includes(t.value)) return;
    if (t.kind === 'symbol' && symbols.includes(t.value)) return;
    if (t.kind === 'operator' && ['+','-','*','/',':','^'].includes(t.value)) return;
    if (t.kind === 'punctuation' && ['(',')',','].includes(t.value)) return;
    throw new TypeError('Unsupported semantic token');
  }
  function tokenize(source, options={}) {
    if (typeof source !== 'string' || source.length > 10000) throw new TypeError('Invalid calculator entry');
    const tokens = [];
    let i=0;
    while (i<source.length) {
      if (/\s/.test(source[i])) { i++; continue; }
      const rest=source.slice(i);
      const match=(options.physical?rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)E[+-]?\d{1,2}(?!\d)/):null) || rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/) || rest.match(/^[A-Za-z]+/) || rest.match(/^[+\-*/:^(),]/);
      if (!match) throw new TypeError(`Unsupported entry at ${i}`);
      const word=match[0];
      const value=functions.includes(word.toLowerCase()) || ['pi','ans'].includes(word.toLowerCase()) ? word.toLowerCase() : word;
      const kind=/^[\d.]/.test(value)?'number':functions.includes(value)?'function':symbols.includes(value)?'symbol':['(',')',','].includes(value)?'punctuation':'operator';
      const token={kind,value};validateToken(token);tokens.push(token);i+=value.length;
    }
    return tokens;
  }
  function serialize(tokens) { tokens.forEach(validateToken); return tokens.map(t=>t.value).join(''); }
  function parseTokens(tokens, options={}) {
    tokens.forEach(validateToken);
    if (tokens.length>1000) throw new TypeError('Expression token limit');
    let i=0, depth=0;
    const peek=()=>tokens[i]?.value;
    const take=value=>peek()===value?(i++,true):false;
    const binary=(operator,left,right,implied=false)=>({kind:'binary',operator,left,right,implied});
    const primary=()=>{
      if (++depth>100) throw new TypeError('Expression depth limit');
      let value;
      if(take('(')){value=expression();if(!take(')'))throw new TypeError('Missing parenthesis');}
      else {
        const token=tokens[i++];
        if (!token) throw new TypeError('Incomplete expression');
        if(token.kind==='number')value={kind:'number',decimal:token.value};
        else if(token.kind==='symbol')value={kind:'symbol',name:token.value};
        else if(token.kind==='function'){
          if(!take('('))throw new TypeError('Function requires arguments');
          const args=peek()===')'?[]:[expression()];while(take(','))args.push(expression());
          if(!take(')'))throw new TypeError('Missing parenthesis');
          const arity=({root:2,ncr:2,npr:2,dms:3,frac:3,cv:2,random:0,dice:0,coin:0,rint:0}[token.value] ?? 1);
          if(args.length!==arity)throw new TypeError('Wrong function arity');
          value={kind:'call',name:token.value,args};
        } else throw new TypeError('Invalid operand');
      }
      depth--; return value;
    };
    const unary=()=>take('+')?{kind:'unary',operator:'+',operand:unary()}:take('-')?{kind:'unary',operator:'-',operand:unary()}:primary();
    // The measured physical profile chains powers left to right. Keep the
    // enhanced profile's established grammar for existing integrations.
    const power=()=>{let left=unary();if(options.physical){while(take('^'))left=binary('^',left,unary());return left;}return take('^')?binary('^',left,power()):left;};
    const startsTerm=()=>tokens[i] && ['number','symbol','function'].includes(tokens[i].kind) || peek()==='(';
    const implied=()=>{let left=power();while(startsTerm())left=binary('*',left,power(),true);return left;};
    const term=()=>{
      if(options.physical){let left=implied();while(['*','/',':'].includes(peek())){const op=tokens[i++].value;left=binary(op===':'?'/':op,left,implied());}return left;}
      let left=power();
      while(['*','/',':'].includes(peek()) || startsTerm()) {
        const explicit=['*','/',':'].includes(peek()); const operator=explicit?tokens[i++].value:'*';
        left=binary(operator===':'?'/':operator,left,power(),!explicit);
      }
      return left;
    };
    const expression=()=>{let left=term();while(['+','-'].includes(peek())){const op=tokens[i++].value;left=binary(op,left,term());}return left;};
    const ast=expression();if(i!==tokens.length)throw new TypeError('Unexpected token');return ast;
  }
  function createEditor(tokens=[], cursor={index:tokens.length,offset:0,path:[]}, template=null) {
    const editor={tokens:structuredClone(tokens),cursor:structuredClone(cursor),template:structuredClone(template),ast:null,incomplete:true};
    validateEditor(editor);
    try { editor.ast=parseTokens(editor.tokens);editor.incomplete=false; } catch(error) { if(!(error instanceof TypeError))throw error; }
    return editor;
  }
  function validateEditor(editor) {
    if(!editor || Object.keys(editor).sort().join()!=='ast,cursor,incomplete,template,tokens' || typeof editor.incomplete!=='boolean'
      || !Array.isArray(editor.tokens) || editor.tokens.length>1000)throw new TypeError('Invalid token editor');
    editor.tokens.forEach(validateToken);
    const c=editor.cursor;
    if(!c || Object.keys(c).sort().join()!=='index,offset,path' || !Number.isInteger(c.index) || c.index<0 || c.index>editor.tokens.length || !Number.isInteger(c.offset) || c.offset<0
      || !Array.isArray(c.path) || !c.path.every(p=>typeof p==='string')
      || c.offset && (editor.tokens[c.index]?.kind!=='number' || c.offset>editor.tokens[c.index].value.length))throw new TypeError('Invalid semantic cursor');
  }
  function edit(editor, command) {
    validateEditor(editor);
    const tokens=structuredClone(editor.tokens), cursor=structuredClone(editor.cursor);
    if(command.type==='move') {
      if(![-1,1].includes(command.direction))throw new TypeError('Invalid cursor motion');
      cursor.index=Math.max(0,Math.min(tokens.length,cursor.index+command.direction));cursor.offset=0;
    } else if(command.type==='digit') {
      if(!/^[0-9.]$/.test(command.value))throw new TypeError('Invalid entry digit');
      const index=cursor.offset?cursor.index:cursor.index-1;
      if(index>=0 && tokens[index]?.kind==='number') {
        const token=tokens[index], offset=cursor.offset || token.value.length;
        const value=token.value.slice(0,offset)+command.value+token.value.slice(offset);
        validateToken({kind:'number',value}); token.value=value;
        cursor.index=index;cursor.offset=offset+1;
      } else { tokens.splice(cursor.index++,0,{kind:'number',value:command.value==='.'?'0.':command.value}); cursor.offset=0; }
    } else if(command.type==='insert') {
      validateToken(command.token);
      if(cursor.offset){const t=tokens[cursor.index];const left=t.value.slice(0,cursor.offset),right=t.value.slice(cursor.offset);
        tokens.splice(cursor.index,1,...[left,right].filter(Boolean).map(value=>({kind:'number',value})));cursor.index+=left?1:0;}
      tokens.splice(cursor.index++,0,structuredClone(command.token));cursor.offset=0;
    } else if(command.type==='backspace' || command.type==='delete') {
      if(cursor.offset && tokens[cursor.index]?.kind==='number') {
        const token=tokens[cursor.index], offset=command.type==='backspace'?cursor.offset-1:cursor.offset;
        if(offset<token.value.length) {
          const value=token.value.slice(0,offset)+token.value.slice(offset+1);
          if(value && value!=='.') {token.value=value;cursor.offset=offset;}
          else {tokens.splice(cursor.index,1);cursor.offset=0;}
        }
        return createEditor(tokens,cursor,editor.template);
      }
      const index=command.type==='backspace'?cursor.index-1:cursor.index;
      if(index>=0 && index<tokens.length){tokens.splice(index,1);cursor.index=Math.max(0,index);}cursor.offset=0;
    } else throw new TypeError('Unknown editor command');
    return createEditor(tokens,cursor,editor.template);
  }
  function validateAst(ast, depth=0) {
    if(!ast || depth>100)throw new TypeError('Invalid AST');
    const keys=Object.keys(ast).sort().join();
    if(ast.kind==='number' && keys==='decimal,kind' && /^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d{1,2})?$/.test(ast.decimal))return;
    if(ast.kind==='symbol' && keys==='kind,name' && symbols.includes(ast.name))return;
    if(ast.kind==='unary' && keys==='kind,operand,operator' && ['+','-'].includes(ast.operator)){validateAst(ast.operand,depth+1);return;}
    if(ast.kind==='binary' && keys==='implied,kind,left,operator,right' && ['+','-','*','/','^'].includes(ast.operator) && typeof ast.implied==='boolean'){validateAst(ast.left,depth+1);validateAst(ast.right,depth+1);return;}
    if(ast.kind==='call' && keys==='args,kind,name' && functions.includes(ast.name) && Array.isArray(ast.args)
      && ast.args.length===({root:2,ncr:2,npr:2,dms:3,frac:3,cv:2,random:0,dice:0,coin:0,rint:0}[ast.name]??1)){ast.args.forEach(a=>validateAst(a,depth+1));return;}
    throw new TypeError('Unsupported AST node');
  }
  function evaluate(ast, adapter, scope={}) {
    validateAst(ast);
    const visit=n=>{
      if(n.kind==='number')return adapter.number(n.decimal);
      if(n.kind==='symbol')return adapter.symbol(n.name,scope);
      if(n.kind==='unary')return adapter.unary(n.operator,visit(n.operand));
      if(n.kind==='binary')return adapter.binary(n.operator,visit(n.left),visit(n.right));
      return adapter.call(n.name,n.args.map(visit),scope);
    };
    return visit(ast);
  }
  return Object.freeze({tokenize,serialize,parseTokens,createEditor,validateEditor,edit,validateAst,evaluate,functions,symbols});
});
