(function(host,factory){
  const api=factory();
  if(typeof module==='object' && module.exports && typeof document==='undefined') module.exports=api;
  else host.ScientificCalculatorFormatting=api;
})(globalThis,function(){
  'use strict';
  const SELECT_START="\uE000", SELECT_END="\uE001", DIVIDE_TOKEN=":";
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
        const selected = expression[index + 1] || "";
        output += `<span class="scicalc__selected-char">${formatExpression(selected)}</span>`;
        index += expression[index + 2] === SELECT_END ? 3 : 2;
        continue;
      }
      if (expression[index] === SELECT_END) {
        index += 1;
        continue;
      }
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

  function renderState(state) {
    const expressionForDisplay = () => {
      const { displayExpression: expression, selectionActive, cursor } = state;
      if (!expression) {
        return "";
      }
      if (!selectionActive || cursor >= expression.length) {
        return expression;
      }
      return `${expression.slice(0, cursor)}${SELECT_START}${expression[cursor]}${SELECT_END}${expression.slice(cursor + 1)}`;
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

    return {
      expressionHtml: formatExpression(expressionForDisplay()),
      resultHtml: state.stagedEntry?.type === 'fraction' ? stagedFractionHtml() : formatExpression(state.displayResult || '0'),
      angleLabel: state.angleMode, secondActive: state.secondActive, lifecycle: state.lifecycle,
    };
  }
  return Object.freeze({formatValue,formatExpression,renderState});
});
