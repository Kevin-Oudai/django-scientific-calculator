(function(host,factory){
  const api=factory();
  if(typeof module==='object' && module.exports && typeof document==='undefined') module.exports=api;
  else host.ScientificCalculatorFormatting=api;
})(globalThis,function(){
  'use strict';
  const SELECT_START="\uE000", SELECT_END="\uE001", DIVIDE_TOKEN=":";
  // Decimal display rounding is independent of the evaluator. Work on base-10
  // integers so ties (including negative ties) do not depend on binary floats.
  function decimalParts(value) {
    const match=String(Math.abs(value)).match(/^(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
    return {digits:BigInt(match[1]+(match[2]||'')),scale:(match[2]||'').length-Number(match[3]||0)};
  }
  function decimalAt(value, places, round=false) {
    const {digits,scale}=decimalParts(value),shift=places-scale;
    let integer;
    if(shift>=0)integer=digits*10n**BigInt(shift);
    else {const divisor=10n**BigInt(-shift);integer=digits/divisor;if(round && digits%divisor*2n>=divisor)integer++;}
    let text=integer.toString();
    if(places>0){text=text.padStart(places+1,'0');text=text.slice(0,-places)+'.'+text.slice(-places);}
    else if(places<0)text+='0'.repeat(-places);
    return value<0?'-'+text:text;
  }
  const grouped=text=>text.replace(/^(\-?)(\d+)/,(_,sign,digits)=>sign+digits.replace(/\B(?=(\d{3})+(?!\d))/g,"'"));
  const trimDecimal=text=>text.includes('.')?text.replace(/0+$/,'').replace(/\.$/,'.'):text+'.';
  function sharpNumber(value,settings={format:'NORM1',tab:9}) {
    value=Number(value);
    if(!Number.isFinite(value)||Math.abs(value)>=1e100)return {text:'Error 2',html:'Error 2',roundedValue:value};
    if(Math.abs(value)<1e-99)value=0;
    const format=settings.format||'NORM1',tab=settings.tab??9,absolute=Math.abs(value);
    let exponent=absolute?Number(absolute.toExponential().split('e')[1]):0;
    const scientific=format==='SCI'||format==='ENG'||absolute>=1e10||(['NORM1','NORM2'].includes(format)&&absolute!==0&&absolute<(format==='NORM2'?.01:1e-9));
    // NORMAL first rounds ten significant digits, then the LCD's ten numeric
    // positions limit a decimal with leading zeros. Thus sqrt(3) rounds up,
    // while 1/7 still displays 0.142857142. Keep an in-range decimal at the
    // upper boundary instead of introducing a display-only overflow.
    if(['NORM1','NORM2'].includes(format)&&absolute){
      const rounded=Number(decimalAt(value,9-exponent,true));
      if(!(absolute<1e10&&Math.abs(rounded)>=1e10))value=rounded;
    }
    let mantissa,roundedValue;
    if(scientific){
      const engineering=format==='ENG';
      if(engineering)exponent=Math.floor(exponent/3)*3;
      // Decimal shifting avoids introducing a binary multiplication rounding error.
      const scaled=Number(value.toExponential().replace(/e([+-]?\d+)$/,(_,e)=>'e'+(Number(e)-exponent)));
      const norm=format==='NORM1'||format==='NORM2'||format==='FIX';
      let places=norm?9:Math.min(tab,10-Math.max(1,Math.floor(Math.log10(Math.abs(scaled)||1))+1));
      mantissa=decimalAt(scaled,places,!norm);
      if(Math.abs(Number(mantissa))>=(engineering?1000:10)){
        exponent+=engineering?3:1;
        mantissa=decimalAt(Number(mantissa)/(engineering?1000:10),norm?9:Math.min(tab,9),!norm);
      }
      if(norm)mantissa=trimDecimal(mantissa);else if(!mantissa.includes('.'))mantissa+='.';
      roundedValue=Number(mantissa+'e'+exponent);
      if(exponent>99)return {text:'Error 2',html:'Error 2',roundedValue:Infinity};
      const exp=(exponent<0?'-':'')+String(Math.abs(exponent)).padStart(2,'0');
      const text=mantissa+'×10'+exp;
      return {text,html:escapeHtml(mantissa)+'<span class="scicalc__display-operator">&times;</span>10<sup>'+exp+'</sup>',roundedValue,mantissa,exponent};
    }
    const places=format==='FIX'?Math.min(tab,10-Math.max(1,exponent+1)):Math.max(0,10-Math.max(1,exponent+1));
    mantissa=decimalAt(value,places,format==='FIX');
    if(format!=='FIX')mantissa=trimDecimal(mantissa);else if(!mantissa.includes('.'))mantissa+='.';
    if(Math.abs(Number(mantissa))>=1e10)return sharpNumber(Number(mantissa),{format:'SCI',tab:Math.min(tab,9)});
    roundedValue=Number(mantissa);
    const text=grouped(mantissa);
    return {text,html:escapeHtml(text),roundedValue,mantissa,exponent:null};
  }
  function sharpEntry(text){
    if(text==='-')return '-0.';
    if(!/^-?\d*(?:\.\d*)?$/.test(text)||text==='')return escapeHtml(text);
    return escapeHtml(grouped(text.includes('.')?text:text+'.'));
  }
  function catalogueNumber(entry,settings){
    if(!entry.includes('E')||!['NORM1','NORM2'].includes(settings.format))return sharpNumber(Number(entry),settings).html;
    return sharpNumber(Number(entry),{format:'SCI',tab:9}).html.replace(/^(-?\d+\.\d*?)0+(?=<span)/,'$1');
  }
  function formatTyped(value,settings,options={}) {
    if(typeof value==='number')return sharpNumber(value,settings).html;
    if(typeof value==='string')return escapeHtml(value);
    if(!value)return '';
    if(value.kind==='scalar')return sharpNumber(value.value,settings).html;
    if(value.kind==='rational'){
      let numeric=Number(value.numerator)/Number(value.denominator);
      if(Number.isNaN(numeric)){
        const negative=value.numerator.startsWith('-'),n=value.numerator.replace(/^-/,''),d=value.denominator;
        numeric=(negative?-1:1)*Number(n.slice(0,16))/Number(d.slice(0,16))*10**(n.length-Math.min(16,n.length)-d.length+Math.min(16,d.length));
      }
      return options.fraction?formatExpression(value.numerator+'/'+value.denominator):sharpNumber(numeric,settings).html;
    }
    if(value.kind==='dms')return `${value.sign<0?'-':''}${value.degrees}<sup>&deg;</sup>${value.minutes}&#8242;${sharpNumber(value.seconds,settings).html.replace(/\.$/,'')}&#8243;`;
    if(value.kind==='nbase'){
      const integer=BigInt(value.integer),encoded=integer<0n&&value.radix!==10?integer+(value.digits?BigInt(value.radix)**BigInt(value.digits):1n<<BigInt(value.width)):integer;
      return escapeHtml(encoded.toString(value.radix).toUpperCase());
    }
    if(value.kind==='complex'){
      const imaginary=formatTyped(value.imaginary,settings,options);
      return formatTyped(value.real,settings,options)+(imaginary.startsWith('-')?' &minus; '+imaginary.slice(1):' + '+imaginary)+'i';
    }
    if(value.kind==='equation')return value.components.map(c=>escapeHtml(c.label)+' = '+formatTyped(c.value,settings,options)).join('; ');
    if(value.kind==='matrix')return Array.from({length:value.rows},(_,row)=>value.elements.slice(row*value.columns,(row+1)*value.columns).map(v=>formatTyped(v,settings,options)).join(', ')).join('; ');
    if(value.kind==='list')return value.elements.map(v=>formatTyped(v,settings,options)).join(', ');
    if(value.kind==='statistics')return value.rows.map((r,i)=>'x'+(i+1)+' = '+formatTyped(r.x,settings,options)+(r.y?' y'+(i+1)+' = '+formatTyped(r.y,settings,options):'')+' w = '+sharpNumber(r.weight,settings).html).join('; ');
    throw new TypeError('Unsupported display value');
  }
  function formatValue(value) {
    if (!Number.isFinite(value)) {
      return "Error";
    }
    const rounded = Math.abs(value) < 1e-12 ? 0 : value;
    const absolute = Math.abs(rounded);
    if (absolute !== 0 && (absolute >= 1e10 || absolute < 1e-6)) {
      const [mantissa, exponent] = rounded.toExponential(8).split("e");
      return `${Number.parseFloat(mantissa).toString()}*10^${Number.parseInt(exponent, 10)}`;
    }
    return Number.parseFloat(rounded.toPrecision(12)).toString();
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatExpression(expression) {
    if (!expression) {
      return "0";
    }

    let output = "";
    let index = 0;

    const readSimpleToken = (start) => {
      let end = start;
      if (expression[end] === "-") {
        end += 1;
      }
      while (/[a-zA-Z0-9.]/.test(expression[end] || "")) {
        end += 1;
      }
      return {
        token: expression.slice(start, end) || expression[start] || "",
        end: end > start ? end : start + 1,
      };
    };

    const readParenthesized = (start) => {
      let depth = 0;
      for (let end = start; end < expression.length; end += 1) {
        if (expression[end] === "(") {
          depth += 1;
        }
        if (expression[end] === ")") {
          depth -= 1;
          if (depth === 0) {
            return {
              token: expression.slice(start + 1, end),
              end: end + 1,
            };
          }
        }
      }
      return readSimpleToken(start);
    };

    while (index < expression.length) {
      if (expression[index] === SELECT_START) {
        const end = expression.indexOf(SELECT_END,index+1);
        const selected = end < 0 ? expression[index + 1] || "" : expression.slice(index+1,end);
        output += `<span class="scicalc__selected-char">${formatExpression(selected)}</span>`;
        index = end < 0 ? index + 2 : end + 1;
        continue;
      }
      if (expression[index] === SELECT_END) {
        index += 1;
        continue;
      }
      const randomLabel=expression.slice(index).match(/^R-(?:DICE|COIN|INT)/);
      if(randomLabel){output+=escapeHtml(randomLabel[0]);index+=randomLabel[0].length;continue;}
      const dmsMatch = expression.slice(index).match(/^dms\((-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/);
      if (dmsMatch) {
        output += `${escapeHtml(dmsMatch[1])}<sup>&deg;</sup>${escapeHtml(dmsMatch[2])}&#8242;${escapeHtml(dmsMatch[3])}&#8243;`;
        index += dmsMatch[0].length;
        continue;
      }
      if (expression[index] === "(") {
        const numerator = readParenthesized(index);
        if (expression[numerator.end] === "/") {
          const denominator = readSimpleToken(numerator.end + 1);
          if (/^-?\d+(?:\.\d+)?$/.test(denominator.token)) {
            output += `<span class="scicalc__display-fraction"><span>${formatExpression(numerator.token)}</span><span>${escapeHtml(denominator.token)}</span></span>`;
            index = denominator.end;
            continue;
          }
        }
      }
      const mixedMatch = expression.slice(index).match(/^(-?\d+)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/);
      if (mixedMatch) {
        output += `${escapeHtml(mixedMatch[1])}<span class="scicalc__display-fraction"><span>${escapeHtml(mixedMatch[2])}</span><span>${escapeHtml(mixedMatch[3])}</span></span>`;
        index += mixedMatch[0].length;
        continue;
      }
      const fractionMatch = expression.slice(index).match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/);
      if (fractionMatch) {
        output += `<span class="scicalc__display-fraction"><span>${escapeHtml(fractionMatch[1])}</span><span>${escapeHtml(fractionMatch[2])}</span></span>`;
        index += fractionMatch[0].length;
        continue;
      }
      const partialFractionMatch = expression.slice(index).match(/^(-?\d+(?:\.\d+)?)\/(?=$|[+\-*:^)])/);
      if (partialFractionMatch) {
        output += `<span class="scicalc__display-fraction"><span>${escapeHtml(partialFractionMatch[1])}</span><span>&nbsp;</span></span>`;
        index += partialFractionMatch[0].length;
        continue;
      }
      if (expression.startsWith("sqrt(", index)) {
        output += "&radic;(";
        index += 5;
        continue;
      }
      if (expression.startsWith("pi", index)) {
        output += "&pi;";
        index += 2;
        continue;
      }
      if (expression.startsWith("ans", index)) {
        output += "Ans";
        index += 3;
        continue;
      }

      const char = expression[index];
      if (char === "^") {
        const next = expression[index + 1] === "("
          ? readParenthesized(index + 1)
          : readSimpleToken(index + 1);
        output += `<sup>${formatExpression(next.token)}</sup>`;
        index = next.end;
        continue;
      }

      const replacements = {
        "*": '<span class="scicalc__display-operator">&times;</span>',
        [DIVIDE_TOKEN]: '<span class="scicalc__display-operator">&divide;</span>',
        "+": '<span class="scicalc__display-operator">+</span>',
        "-": '<span class="scicalc__display-operator">&minus;</span>',
        "=": '<span class="scicalc__display-operator">=</span>',
      };
      output += replacements[char] || escapeHtml(char);
      index += 1;
    }

    return output;
  }

  function physicalExpression(source){
    source=source.replace(/\b(?:xmean|ymean|sigmax|sigmay|sx|sy|statn|sumxx|sumx|sumyy|sumy|sumxy|rega|regb|regc|regr)\b/g,name=>({xmean:'x\u0305',ymean:'y\u0305',sx:'Sx',sy:'Sy',sigmax:'\u03c3x',sigmay:'\u03c3y',statn:'n',sumx:'\u03a3x',sumxx:'\u03a3x\u00b2',sumy:'\u03a3y',sumyy:'\u03a3y\u00b2',sumxy:'\u03a3xy',rega:'a',regb:'b',regc:'c',regr:'r'})[name]);
    source=source.replace(/(?:random|dice|coin|rint)\(\)/g,name=>({'random()':'RANDOM','dice()':'R-DICE','coin()':'R-COIN','rint()':'R-INT'}[name]));
    // Internal calls remain evaluable; the physical display uses postfix notation.
    for(let count=0;count<20&&/cv\(/.test(source);count++){
      const changed=source.replace(/cv\(([^(),]+),(\d+)\)/g,(_,operand,index)=>operand+'→cv'+index);
      if(changed===source)break;source=changed;
    }

    source=source.replace(/\((-?\d+(?:\.\d*)?)\*tenpow\((-?\d+)\)\)/g,(_,base,exponent)=>base+'E'+(exponent.startsWith('-')?'-':'')+exponent.replace('-','').padStart(2,'0'));
    let output='';
    for(let i=0;i<source.length;){
      const match=source.slice(i).match(/^(lsortA|lsortD|ldim|lfill|lcumul|ldiff|laug|lmin|lmax|lmean|lmed|lsum|lprod|lstd|lvar|linner|louter|labs|cpow|polar|conj|dim|fill|cumul|aug|identity|rndmat|det|trans|probp|probq|probr|statt|cv|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|frac|sqrt|cbrt|log|ln|tenpow|epow|fact|root|npr|ncr|kilo|mega|giga|tera|milli|micro|nano|pico|femto)\(/);
      if(!match){output+=source[i]==='/'&&/^[a-z]+\(/i.test(source.slice(i+1))?'┌':source[i];i++;continue;}
      let depth=1,j=i+match[0].length,start=j,args=[];
      for(;j<source.length;j++){if(source[j]==='(')depth++;else if(source[j]===')'){if(--depth===0)break;}else if(source[j]===','&&depth===1){args.push(source.slice(start,j));start=j+1;}}
      args.push(source.slice(start,j));args=args.map(physicalExpression);
      const name=match[1],units={kilo:'k',mega:'M',giga:'G',tera:'T',milli:'m',micro:'µ',nano:'n',pico:'p',femto:'f'};
      const prefixes={sqrt:'√',cbrt:'³√',tenpow:'10^',epow:'e^'};
      const listNames={lsortA:'sortA',lsortD:'sortD',ldim:'dim(',lfill:'fill(',lcumul:'cumul',ldiff:'df_list',laug:'aug(',lmin:'min',lmax:'max',lmean:'mean',lmed:'med',lsum:'sum',lprod:'prod',lstd:'stdDv',lvar:'vari',linner:'i_prod(',louter:'o_prod(',labs:'abs'};
      output+=listNames[name]?listNames[name]+args.join(','):name==='aug'?'aug('+args.join(','):name==='polar'?args[0]+'\u2220'+(args[1]||''):name==='cpow'?args[0]+'^'+(args[1]||''):/^prob[pqr]$/.test(name)?name.slice(-1).toUpperCase()+'('+args[0]:name==='statt'?args[0]+'\u2192t':name==='cv'?args[0]+'→cv'+args[1]:name==='frac'?(args[0]==='0'?'':args[0]+' ')+args[1]+'/'+(args[2]||''):name==='fact'?args[0]+'!':name==='root'?args[0]+'ˣ√'+(args[1]||''):name==='npr'?args[0]+'P'+(args[1]||''):name==='ncr'?args[0]+'C'+(args[1]||''):units[name]?args[0]+units[name]:prefixes[name]?prefixes[name]+args[0]:({asin:'sin⁻¹',acos:'cos⁻¹',atan:'tan⁻¹',asinh:'sinh⁻¹',acosh:'cosh⁻¹',atanh:'tanh⁻¹'})[name]?( {asin:'sin⁻¹',acos:'cos⁻¹',atan:'tan⁻¹',asinh:'sinh⁻¹',acosh:'cosh⁻¹',atanh:'tanh⁻¹'}[name]+args[0]):name+args[0];
      i=j<source.length?j+1:j;
    }
    return output;
  }
  function renderState(state, options = {}) {
    const expressionForDisplay = () => {
      const { displayExpression: expression, selectionActive, cursor } = state;
      if (!expression) {
        return "";
      }
      if (!selectionActive || cursor >= expression.length) {
        return expression;
      }
      const cell=options.physical ? expression.slice(cursor).match(/^(?:(?:asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|sqrt|cbrt|recip|tenpow|epow|sin|cos|tan|log|ln|abs|fact|pct)\(|ans|pi|\^\(-1\)|\^\d|.)/)[0] : expression[cursor];
      return `${expression.slice(0, cursor)}${SELECT_START}${cell}${SELECT_END}${expression.slice(cursor + cell.length)}`;
    };

    const stagedFractionHtml = () => {
      const { stagedEntry } = state;
      const partHtml = (part) => {
        const value = stagedEntry[part];
        const classes = [
          "scicalc__fraction-template-part",
          stagedEntry.part === part ? "is-active" : "",
        ].filter(Boolean).join(" ");
        const content = value
          ? formatExpression(value)
          : '<span class="scicalc__fraction-template-blank">□</span>';
        return `<span class="${classes}">${content}</span>`;
      };
      return `<span class="scicalc__display-fraction scicalc__display-fraction--template">${partHtml("numerator")}${partHtml("denominator")}</span>`;
    };

    const view = {
      expressionHtml: formatExpression(expressionForDisplay()),
      resultHtml: state.stagedEntry?.type === 'fraction' ? stagedFractionHtml() : formatExpression(state.displayResult || '0'),
      angleLabel: state.angleMode, secondActive: state.secondActive, lifecycle: state.lifecycle,
    };
    if (!options.physical) return view;
    const settings = state.layers.settings;
    if(state.stagedEntry?.type==='physicalFraction'){const stage=state.stagedEntry;view.resultHtml=(stage.whole?formatExpression(stage.whole):'')+stagedFractionHtml();}
    if(state.stagedEntry?.type==='exp'){
      const stage=state.stagedEntry,exponent=Number(stage.exponent)||0;
      view.resultHtml=sharpEntry(stage.base)+'<span class="scicalc__display-operator">&times;</span>10<sup>'+(stage.exponent.startsWith('-')?'-':'')+String(Math.abs(exponent)).padStart(2,'0')+'</sup>';
    }
    if(!state.stagedEntry && state.lifecycle!=='error'){
      if(state.entry&&state.layers.intent?.kind==='catalogue-value')view.resultHtml=catalogueNumber(state.entry,settings);
      else if(state.entry)view.resultHtml=state.entry==='-'||/^-?\d*(?:\.\d*)?$/.test(state.entry)?sharpEntry(state.entry):formatExpression(state.entry);
      else if(state.lifecycle==='evaluated'&&state.values.last.kind==='dms'&&state.resultMode==='decimal')view.resultHtml=sharpNumber(state.lastValue,settings).html;
      else if(state.lifecycle==='evaluated')view.resultHtml=['NORM1','NORM2'].includes(settings.format)&&['mixed','improper'].includes(state.resultMode)?formatExpression(state.displayResult):formatTyped(state.values.last,settings);
      else if(state.displayResult!=='')view.resultHtml=sharpNumber(Number(state.displayResult)||0,settings).html;
    }
    const workflow = state.workflow;
    const mode = state.layers.mode;
    const indicators = {
      '2ndF': state.secondActive, HYP: state.layers.hyp, ALPHA: state.layers.alpha || ['STO','RCL','STATVAR'].includes(workflow.payload?.id),
      FIX: settings.format === 'FIX', SCI: settings.format === 'SCI', ENG: settings.format === 'ENG',
      DEG: settings.angle === 'DEG', RAD: settings.angle === 'RAD', GRAD: settings.angle === 'GRAD',
      CPLX: mode === 'CPLX', MAT: mode === 'MAT', LIST: mode === 'LIST', STAT: mode === 'STAT',
      M: state.memoryValue !== 0 || state.values.memory.kind==='complex'&&(state.values.memory.imaginary.kind==='rational'?state.values.memory.imaginary.numerator!=='0':state.values.memory.imaginary.value!==0), BIN: false, PEN: false, OCT: false, DEC: false, HEX: false,
      'xy': false, 'rθ': false, '?': workflow.kind === 'prompt', '∠': false, 'i': false,
    };
    if(state.control?.nbase?.radix!==10&&state.control?.nbase)indicators[({2:'BIN',5:'PEN',8:'OCT',16:'HEX'})[state.control.nbase.radix]]=true;
    const expression = state.displayExpression;
    if(mode==='CPLX'){
      const p=state.layers.intent,polar=p?.polar===true,component=p?.component===1;
      indicators[polar?'r\u03b8':'xy']=true;
      if(state.lifecycle==='evaluated'&&state.values.last.kind==='complex'){
        const real=state.values.last.real,imaginary=state.values.last.imaginary;
        const numeric=v=>v.kind==='rational'?Number(v.numerator)/Number(v.denominator):v.value;
        const x=numeric(real),y=numeric(imaginary),scale=settings.angle==='RAD'?1:settings.angle==='GRAD'?200/Math.PI:180/Math.PI;
        const value=polar?component?Math.atan2(y,x)*scale:Math.hypot(x,y):component?y:x;
        view.resultHtml=sharpNumber(value,settings).html+(component&&!polar?' <i>i</i>':'');indicators[polar?'\u2220':'i']=component;
      }
    }
    view.expressionHtml = expression ? formatExpression(options.physical?physicalExpression(expressionForDisplay()):expressionForDisplay()) : '';
    if(state.stagedEntry?.type==='binaryFunction'){
      const stage=state.stagedEntry;
      view.expressionHtml=formatExpression(physicalExpression(expressionForDisplay())+physicalExpression(stage.left)+(stage.name==='ncr'?'C':'P'));
      view.resultHtml=sharpEntry(stage.right||'0');
    }
    if(state.lifecycle==='editing'&&state.displayResult==='')view.resultHtml='';
    if(state.layers.mode==='STAT'&&!expression&&!state.entry&&!workflow.kind)view.expressionHtml=escapeHtml('Stat '+(coreSubmodeIndex(state.control?.submode)));
    if(state.lifecycle==='error'&&state.control?.errorCode)view.resultHtml=escapeHtml('Error '+state.control.errorCode);
    view.cursorVisible = (Boolean(expression)||(mode==='LIST'||state.layers.intent?.kind==='nbase-entry')&&state.selectionActive) && ['entering','editing'].includes(state.lifecycle);
    if (view.cursorVisible && (!state.selectionActive || state.cursor >= expression.length)) view.expressionHtml += '<span class="scicalc__cursor" aria-hidden="true"></span>';
    view.insertMode = settings.insert === false ? 'overwrite' : 'insert';
    view.cursorPosition = view.cursorVisible ? state.selectionActive ? state.cursor : expression.length : null;
    view.component = '';
    view.pageStatus = '';
    view.previousPage = false;
    view.nextPage = false;
    if (workflow.kind === 'multi-result') {
      const page = workflow.payload.pages[workflow.page];
      const label = String(page.label ?? '');
      view.expressionHtml = escapeHtml(label);
      view.resultHtml = formatTyped(page.value,settings);
      view.component = String(page.component ?? '');
      view.pageStatus = `${workflow.page + 1} / ${workflow.payload.pages.length}`;
      view.previousPage = workflow.page > 0;
      view.nextPage = workflow.page + 1 < workflow.payload.pages.length;
      view.cursorVisible = false;
      if (['xy','rθ','∠','i'].includes(view.component)) indicators[view.component] = true;
      if(workflow.payload.id==='EQN_RESULTS'&&page.alternate)indicators.xy=true;
    } else if (workflow.kind === 'menu') {
      const choices = workflow.payload.choices || [];
      const groups=workflow.payload.groups;
      const start = groups?groups.slice(0,workflow.page).reduce((a,b)=>a+b,0):workflow.page*2;
      const size=groups?groups[workflow.page]:2;
      const shown = choices.slice(start, start + size);
      view.expressionHtml = shown.map(choice => escapeHtml(String(choice))).join('   ');
      view.resultHtml = shown.map((choice,index) => `${workflow.payload.id==='LIST_MATH'?(start+index).toString(16).toUpperCase():start+index}${workflow.payload.selected!==undefined?workflow.payload.selected===start+index?'•':'':choice === mode || choice === settings.angle || choice === settings.format ? '•' : ''}`).join('   ');
      if(['SETUP','ANGLE','FORMAT','RANDOM'].includes(workflow.payload.id))view.resultHtml=shown.map((choice,index)=>workflow.payload.id==='SETUP'&&index===2&&!['FIX','SCI','ENG'].includes(settings.format)?'':`${start+index}${workflow.payload.selected===start+index?'.':''}`).filter(Boolean).join('   ');
      // The pinned simulator uses a dot; the physical manual specifies a
      // flashing selected number. Retain that reference marker in the text
      // transcript while excluding the decoration from the visible display.
      if(options.physical)view.resultHtml=view.resultHtml.replace(/([0-9A-F])([•.])/g,'<span class="scicalc__menu-selected">$1</span><span class="scicalc__native-menu-marker" aria-hidden="true">$2</span>');
      view.previousPage = start > 0;
      view.nextPage = start + size < choices.length;
      view.cursorVisible = false;
    } else if (workflow.kind === 'prompt' || workflow.kind === 'data-entry') {
      const retainedResultHtml=view.resultHtml;
      view.expressionHtml = escapeHtml(String(workflow.payload.label||workflow.payload.id));
      view.resultHtml = workflow.payload.label?escapeHtml(state.entry||'0'):escapeHtml((workflow.payload.path || []).join('') || '?');
      if(options.physical&&['CONFIRM_MEMORY_CLEAR','CONFIRM_RESET'].includes(workflow.payload.id))view.resultHtml=escapeHtml(sharpEntry(state.entry||'0'));
      if(['STO','RCL'].includes(workflow.payload.id)){
        view.expressionHtml=expression?formatExpression(physicalExpression(expressionForDisplay())):'';
        view.resultHtml=state.stagedEntry?retainedResultHtml:workflow.returnPhase==='evaluated'
          ? ['mixed','improper'].includes(state.resultMode)?formatExpression(state.displayResult):formatTyped(state.values.last,settings)
          :retainedResultHtml;indicators['?']=false;
      }
      if(['ALGB','SOLV'].includes(workflow.payload.id)){
        const p=workflow.payload;
        view.expressionHtml=p.id==='SOLV'?escapeHtml(p.stage==='start'?'Start?':'dx?'):formatExpression(physicalExpression(p.source)).replace(new RegExp('(?<![a-zA-Z])'+p.variables[p.index]+'(?![a-zA-Z])','g'),'<u>'+p.variables[p.index]+'</u>');
        view.resultHtml=p.input?sharpEntry(p.input):sharpNumber(p.defaultValue,settings).html;
        view.cursorVisible=false;indicators['?']=p.id==='ALGB';
      }
      if(['DERIV','INTEGRAL'].includes(workflow.payload.id)){
        const p=workflow.payload;
        view.expressionHtml=escapeHtml(p.stage==='calculating'?'Calculating!':({x:'X?',dx:'dx?',a:'a?',b:'b?',n:'n?'})[p.stage]);
        view.resultHtml=p.stage==='calculating'?'':p.input?p.input.includes('/')?formatExpression(p.input):sharpEntry(p.input):sharpNumber(p.defaultValue,settings).html;
        view.cursorVisible=false;indicators['?']=false;
      }
      if(workflow.payload.id==='TAB')view.resultHtml='';
      if(workflow.payload.id==='EQN_COEFFICIENTS'){const p=workflow.payload;view.resultHtml=p.input?formatExpression(physicalExpression(p.input)):sharpNumber(p.coefficients[p.coefficient],settings).html;indicators['?']=false;}
      if(workflow.payload.id==='LIST_BUFFER'){
        const p=workflow.payload;
        if(p.input){
          const tail=p.input.match(/(?:\d+(?:\.\d*)?)$/)?.[0]||'',prefix=p.input.slice(0,p.input.length-tail.length);
          const scalar=/^-?\d+(?:\.\d*)?$/.test(p.input);
          view.expressionHtml=scalar?'':formatExpression(physicalExpression(prefix));
          view.resultHtml=sharpEntry(scalar?p.input:tail||'0');
          if(!scalar&&prefix)view.expressionHtml+='<span class="scicalc__cursor" aria-hidden="true"></span>';
        }else view.resultHtml=sharpNumber(p.index===-1?p.list.length:p.list[p.index],settings).html;
        indicators['?']=false;
      }
      if(workflow.payload.id==='MAT_BUFFER'){const p=workflow.payload;if(p.input)view.expressionHtml='';view.resultHtml=p.input?formatExpression(physicalExpression(p.input)):sharpNumber(p.index===-2?p.matrix.rows:p.index===-1?p.matrix.columns:p.matrix.data[p.index],settings).html;indicators['?']=false;}
      if(workflow.payload.id==='CNST'){view.expressionHtml='';view.resultHtml=escapeHtml('01-52 ['+(workflow.payload.path||[]).join('')+']');}
      if(workflow.payload.id==='CONV'){view.expressionHtml=formatExpression(physicalExpression(workflow.payload.source)+'→cv');view.resultHtml=sharpEntry((workflow.payload.path||[]).join('')||'0');indicators['?']=false;}
      view.cursorVisible = workflow.payload.id==='LIST_BUFFER'&&Boolean(workflow.payload.input)&&!/^-?\d+(?:\.\d*)?$/.test(workflow.payload.input);
      if(view.cursorVisible)view.cursorPosition=physicalExpression(workflow.payload.input.replace(/\d+(?:\.\d*)?$/,'')).length;
    }
    if(state.historyIndex!==null){view.previousPage=state.historyIndex>0;view.nextPage=state.historyIndex<state.history.length-1;view.pageStatus=`${state.historyIndex+1} / ${state.history.length}`;}
    if(state.control?.power==='off'){
      view.expressionHtml='';view.resultHtml='';view.cursorVisible=false;view.pageStatus='';view.previousPage=false;view.nextPage=false;
      for(const key of Object.keys(indicators))indicators[key]=false;
    }
    if(options.physical)view.expressionHtml=view.expressionHtml.replace(/\bAns\b/g,'ANS');
    if(state.layers.intent?.kind==='formula-store'){view.resultHtml=escapeHtml(state.displayResult);view.cursorVisible=false;}
    if(state.layers.intent?.kind==='nbase-error'){view.expressionHtml=escapeHtml('Error '+state.control.errorCode);view.resultHtml='';view.cursorVisible=false;}
    if(state.layers.intent?.kind==='solver-error'){view.expressionHtml=escapeHtml('Error '+state.control.errorCode);view.resultHtml='';}
    if(state.layers.intent?.kind==='calculus-error'){view.expressionHtml=escapeHtml('Error '+state.control.errorCode);view.resultHtml='';view.cursorVisible=false;}
    if(state.layers.intent?.kind==='calculus-result'&&!workflow.kind&&state.lifecycle==='evaluated'){view.expressionHtml=escapeHtml(state.displayExpression);view.cursorVisible=false;}
    if(options.physical&&mode==='NORMAL'&&state.lifecycle==='error'&&state.control?.nbase?.radix===10){view.expressionHtml=escapeHtml('Error '+state.control.errorCode);view.resultHtml='';view.cursorVisible=false;}
    if(mode==='STAT'&&!workflow.kind&&state.control.power==='on'){
      const p=state.control.statistics,width=state.control.submode==='SD'?2:3;
      if(p.parts.length){view.expressionHtml=formatExpression(p.parts.join(',')+',')+'<span class="scicalc__cursor" aria-hidden="true"></span>';view.cursorVisible=true;}
      if(state.layers.intent?.kind==='statistics-display'){view.expressionHtml=escapeHtml(state.displayExpression);view.resultHtml=sharpNumber(Number(state.displayResult),settings).html;view.cursorVisible=false;}
      if(p.cursor!==null){view.previousPage=p.cursor>0;view.nextPage=p.cursor<state.values.statistics.rows.length*width-1;}
      if(state.layers.intent?.kind==='statistics-error'){view.expressionHtml=escapeHtml('Error '+state.control.errorCode);view.resultHtml='';view.cursorVisible=false;}
    }
    if(state.control?.nbase?.radix!==10&&state.control?.nbase&&state.control.power==='on'&&(!workflow.kind||workflow.kind==='prompt'&&['STO','RCL'].includes(workflow.payload.id))){
      const base=state.control.nbase.radix,name=({2:'BIN',5:'PEN',8:'OCT',16:'HEX'})[base];
      for(const k of ['BIN','PEN','OCT','DEC','HEX'])indicators[k]=k===name;
      const lcd=text=>escapeHtml(text.replace(/ans/g,'ANS').replace(/XNOR|XOR|AND|OR|NOT|NEG|BIN|DEC|PEN|OCT|HEX|\$[A-FXYM]|[0-9A-F]+/g,t=>t.startsWith('$')?t.slice(1):/^[0-9A-F]+$/.test(t)?t.replace(/B/g,'b').replace(/D/g,'d'):t));
      view.expressionHtml=state.lifecycle==='error'?escapeHtml('Error '+state.control.errorCode):lcd(state.displayExpression).replace(/:/g,'&divide;').replace(/\*/g,'&times;')+(view.cursorVisible?'<span class="scicalc__cursor" aria-hidden="true"></span>':'');
      view.resultHtml=(state.lifecycle==='error'?'':lcd(state.entry||(state.lifecycle==='evaluated'?state.displayResult:'0')))+'<sup class="scicalc__base-marker" aria-label="'+name+'">'+({2:'b',5:'P',8:'o',16:'H'})[base]+'</sup>';
    }
    if(options.physical&&['EQN','CPLX','MAT','LIST'].includes(mode)&&state.lifecycle==='error'){view.expressionHtml=escapeHtml('Error '+state.control.errorCode);view.resultHtml='';view.cursorVisible=false;}
    view.indicators = indicators;
    if (!view.cursorVisible) view.cursorPosition = null;
    return view;
  }
  function coreSubmodeIndex(submode){return Math.max(0,['SD','LINE','QUAD','EXP','LOG','PWR','INV'].indexOf(submode));}
  function formatPageValue(value) {
    if (typeof value === 'number') return formatExpression(formatValue(value));
    if (typeof value === 'string') return escapeHtml(value);
    if (value?.kind === 'scalar') return formatExpression(formatValue(value.value));
    if (value?.kind === 'rational') return `<span class="scicalc__display-fraction"><span>${escapeHtml(value.numerator)}</span><span>${escapeHtml(value.denominator)}</span></span>`;
    if (value?.kind === 'nbase') return escapeHtml(BigInt(value.integer).toString(value.radix).toUpperCase());
    return escapeHtml(String(value ?? ''));
  }
  return Object.freeze({formatValue,formatExpression,renderState,formatPageValue,sharpNumber,sharpEntry,formatTyped});
});
