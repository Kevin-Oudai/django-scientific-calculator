(function (host, factory) {
  const api=factory();
  if(typeof module==='object' && module.exports && typeof document==='undefined')module.exports=api;
  else host.ScientificCalculatorValues=api;
})(globalThis,function(){
  'use strict';
  const integer=s=>typeof s==='string' && /^-?(?:0|[1-9]\d*)$/.test(s) && s.length<=1000 && BigInt(s).toString()===s;
  const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const r=a%b;a=b;b=r;}return a;};
  function rational(n,d='1'){
    if(!integer(String(n)) || !integer(String(d)))throw new TypeError('Invalid rational integer');
    n=BigInt(n);d=BigInt(d);if(!d)throw new RangeError('Zero denominator');if(d<0n){n=-n;d=-d;}
    const divisor=gcd(n,d);return {kind:'rational',numerator:(n/divisor).toString(),denominator:(d/divisor).toString()};
  }
  const scalar=value=>{if(typeof value!=='number')throw new TypeError('Invalid scalar');return {kind:'scalar',value};};
  function decimal(text){
    const m=String(text).match(/^(-?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
    if(!m || Math.abs(Number(m[4]||0))>500)throw new TypeError('Invalid rational decimal');
    const exponent=Number(m[4]||0)-(m[3]||'').length;
    const n=BigInt(m[2]+(m[3]||''))*(m[1]?-1n:1n);
    return exponent>=0?rational((n*10n**BigInt(exponent)).toString()):rational(n.toString(),(10n**BigInt(-exponent)).toString());
  }
  function validate(v,depth=0){
    if(!v || typeof v!=='object' || depth>32)throw new TypeError('Invalid typed value');
    const keys=Object.keys(v).sort().join();
    const child=x=>validate(x,depth+1);
    const numeric=x=>{child(x);if(!['scalar','rational'].includes(x.kind))throw new TypeError('Numeric component required');};
    if(v.kind==='scalar' && keys==='kind,value' && typeof v.value==='number')return;
    if(v.kind==='rational' && keys==='denominator,kind,numerator' && integer(v.numerator) && integer(v.denominator)
      && BigInt(v.denominator)>0n && gcd(BigInt(v.numerator),BigInt(v.denominator))===1n)return;
    if(v.kind==='dms' && keys==='degrees,kind,minutes,seconds,sign' && [-1,1].includes(v.sign)
      && Number.isSafeInteger(v.degrees) && v.degrees>=0 && Number.isInteger(v.minutes) && v.minutes>=0 && v.minutes<60
      && typeof v.seconds==='number' && v.seconds>=0 && v.seconds<60)return;
    if(v.kind==='complex' && keys==='imaginary,kind,real'){numeric(v.real);numeric(v.imaginary);return;}
    if(v.kind==='nbase' && ((keys==='integer,kind,radix,signed,width'||keys==='digits,integer,kind,radix,signed,width'&&v.digits===10&&v.signed&&v.width===Math.ceil(Math.log2(v.radix**10)))||keys==='digits,integer,kind,radix,signed,width'&&v.digits===10&&v.signed&&v.width===Math.ceil(Math.log2(v.radix**10))) && integer(v.integer) && [2,5,8,10,16].includes(v.radix)
      && Number.isInteger(v.width) && v.width>0 && v.width<=256 && typeof v.signed==='boolean'){
      const n=BigInt(v.integer),modulus=v.digits?BigInt(v.radix)**BigInt(v.digits):1n<<BigInt(v.width),lower=v.signed?-(modulus/2n):0n,upper=v.signed?(modulus-1n)/2n:modulus-1n;
      if(n<lower || n>upper)throw new RangeError('Fixed-width integer overflow');return;
    }
    if(v.kind==='statistics' && keys==='kind,rows' && Array.isArray(v.rows) && v.rows.length<=10000){
      for(const row of v.rows){if(!row || Object.keys(row).sort().join()!=='weight,x,y' || !Number.isFinite(row.weight) || row.weight===0)throw new TypeError('Invalid observation');numeric(row.x);if(row.y!==null)numeric(row.y);}return;
    }
    if(v.kind==='equation' && keys==='components,kind' && Array.isArray(v.components) && v.components.length<=10000){
      for(const c of v.components){if(!c || Object.keys(c).sort().join()!=='label,value' || typeof c.label!=='string')throw new TypeError('Invalid result component');child(c.value);}return;
    }
    if(v.kind==='matrix' && keys==='columns,elements,kind,rows' && Number.isInteger(v.rows) && v.rows>0 && Number.isInteger(v.columns) && v.columns>0
      && Array.isArray(v.elements) && v.elements.length===v.rows*v.columns && v.elements.length<=10000){v.elements.forEach(numeric);return;}
    if(v.kind==='list' && keys==='elements,kind' && Array.isArray(v.elements) && v.elements.length<=10000){v.elements.forEach(child);return;}
    throw new TypeError('Unsupported typed value');
  }
  function copy(value){validate(value);return structuredClone(value);}
  function toNumber(v){
    validate(v);if(v.kind==='scalar')return v.value;
    if(v.kind==='rational'){
      const direct=Number(v.numerator)/Number(v.denominator);
      if(!Number.isNaN(direct))return direct;
      const negative=v.numerator.startsWith('-'),n=negative?v.numerator.slice(1):v.numerator,d=v.denominator;
      return (negative?-1:1)*Number(n.slice(0,16))/Number(d.slice(0,16))*10**(n.length-Math.min(16,n.length)-d.length+Math.min(16,d.length));
    }
    if(v.kind==='dms')return v.sign*(v.degrees+v.minutes/60+v.seconds/3600);
    if(v.kind==='nbase')return Number(v.integer);
    throw new TypeError('Structured value cannot be coerced to scalar');
  }
  function binary(op,a,b,scalarOperation){
    validate(a);validate(b);
    if(!['scalar','rational'].includes(a.kind) || !['scalar','rational'].includes(b.kind))throw new TypeError('Typed operation implementation pending');
    if((a.kind==='rational' || b.kind==='rational' || op==='/') && Number.isFinite(toNumber(a)) && Number.isFinite(toNumber(b))){
      const ar=a.kind==='rational'?a:decimal(a.value),br=b.kind==='rational'?b:decimal(b.value);
      const n=BigInt(ar.numerator),d=BigInt(ar.denominator),m=BigInt(br.numerator),e=BigInt(br.denominator);
      if(op==='+')return rational((n*e+m*d).toString(),(d*e).toString());
      if(op==='-')return rational((n*e-m*d).toString(),(d*e).toString());
      if(op==='*')return rational((n*m).toString(),(d*e).toString());
      if(op==='/')return rational((n*e).toString(),(d*m).toString());
    }
    return scalar(scalarOperation(op,toNumber(a),toNumber(b)));
  }
  function normalizeDms(number){
    if(!Number.isFinite(number) || Math.abs(number)>=1e6)throw new RangeError('DMS display capacity');
    const sign=number<0 || Object.is(number,-0)?-1:1;
    // Work in rounded seconds to carry across minute/degree boundaries.
    const total=Math.round(Math.abs(number)*3600*1e5)/1e5;
    const degrees=Math.floor(total/3600),minutes=Math.floor((total-degrees*3600)/60);
    const seconds=Number((total-degrees*3600-minutes*60).toFixed(5));
    return copy({kind:'dms',sign,degrees,minutes,seconds});
  }
  function evaluateAst(ast,semantic,adapter,scope={}){
    return semantic.evaluate(ast,{
      number:text=>scalar(adapter.number(text)),
      symbol:(name)=>{
        if(name==='ans' && scope.answer)return copy(scope.answer);
        if(scope.variables && Object.hasOwn(scope.variables,name))return copy(scope.variables[name]);
        return scalar(adapter.symbol(name,{...scope,answer:scope.answer?toNumber(scope.answer):0}));
      },
      unary:(op,v)=>{
        if(op==='+')return copy(v);
        if(v.kind==='rational')return rational((-BigInt(v.numerator)).toString(),v.denominator);
        return scalar(-toNumber(v));
      },
      binary:(op,a,b)=>binary(op,scope.physical&&a.kind==='dms'?scalar(toNumber(a)):a,scope.physical&&b.kind==='dms'?scalar(toNumber(b)):b,adapter.binary),
      call:(name,args)=>{
        if(name==='frac' && scope.physical){
          const negative=toNumber(args[0])<0||Object.is(toNumber(args[0]),-0);
          const [whole,numerator,denominator]=args.map(v=>decimal(toNumber(v)));
          const part=binary('/',numerator,denominator,adapter.binary);
          const absolute=whole.numerator.startsWith('-')?rational(whole.numerator.slice(1),whole.denominator):whole;
          const result=binary('+',absolute,part,adapter.binary);
          return negative?rational((-BigInt(result.numerator)).toString(),result.denominator):result;
        }
        if(name==='dms' && scope.physical)return scalar(adapter.call(name,args.map(toNumber),scope));
        if(name==='dms'){
          const [degrees,minutes,seconds]=args.map(toNumber);
          return copy({kind:'dms',sign:degrees<0 || Object.is(degrees,-0)?-1:1,degrees:Math.abs(degrees),minutes,seconds});
        }
        return scalar(adapter.call(name,args.map(toNumber),scope));
      },
    },scope);
  }
  // Conversion creates a view; the original tagged source is never replaced.
  function view(v,mode='default',format=String){
    validate(v);const components=[];
    const add=(label,value,text)=>components.push({label,value:copy(value),text});
    if(v.kind==='scalar')add('',v,format(v.value));
    else if(v.kind==='rational')add('',v,mode==='decimal'?format(toNumber(v)):`${v.numerator}/${v.denominator}`);
    else if(v.kind==='dms')add('',v,mode==='decimal'?format(toNumber(v)):`${v.sign<0?'-':''}${v.degrees}Â°${v.minutes}â€²${v.seconds}â€³`);
    else if(v.kind==='nbase'){
      const n=BigInt(v.integer),encoded=n<0n?n+(v.digits?BigInt(v.radix)**BigInt(v.digits):1n<<BigInt(v.width)):n;
      add('',v,encoded.toString(v.radix).toUpperCase());
    } else if(v.kind==='complex'){
      if(mode==='polar'){
        const real=toNumber(v.real),imaginary=toNumber(v.imaginary);
        add('r',scalar(Math.hypot(real,imaginary)),format(Math.hypot(real,imaginary)));
        add('theta',scalar(Math.atan2(imaginary,real)),format(Math.atan2(imaginary,real)));
      }else{add('real',v.real,format(toNumber(v.real)));add('imaginary',v.imaginary,format(toNumber(v.imaginary)));}
    } else if(v.kind==='equation'){for(const c of v.components)add(c.label,c.value,view(c.value,mode,format).components.map(c=>c.text).join(', '));}
    else if(v.kind==='matrix'){v.elements.forEach((value,i)=>add(`${Math.floor(i/v.columns)+1},${i%v.columns+1}`,value,view(value,mode,format).components.map(c=>c.text).join(', ')));}
    else if(v.kind==='list'){v.elements.forEach((value,i)=>add(String(i+1),value,view(value,mode,format).components.map(c=>c.text).join(', ')));}
    else if(v.kind==='statistics'){v.rows.forEach((row,i)=>{add(`x${i+1}`,row.x,format(toNumber(row.x)));if(row.y)add(`y${i+1}`,row.y,format(toNumber(row.y)));add(`weight${i+1}`,scalar(row.weight),format(row.weight));});}
    return {sourceKind:v.kind,mode,components};
  }
  return Object.freeze({scalar,rational,decimal,normalizeDms,validate,copy,toNumber,binary,evaluateAst,view});
});
