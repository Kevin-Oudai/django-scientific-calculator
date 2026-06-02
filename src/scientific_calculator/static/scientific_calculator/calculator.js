(function () {
  const SELECT_START = "\uE000";
  const SELECT_END = "\uE001";
  const DIVIDE_TOKEN = ":";

  class Parser {
    constructor(input, angleMode, answer) {
      this.input = normalizeExpression(input).replaceAll(DIVIDE_TOKEN, "/").replace(/\s+/g, "");
      this.angleMode = angleMode;
      this.answer = answer;
      this.index = 0;
    }

    parse() {
      const value = this.parseExpression();
      if (this.index < this.input.length) {
        throw new Error("Unexpected input");
      }
      return value;
    }

    peek() {
      return this.input[this.index] || "";
    }

    consume(char) {
      if (this.input[this.index] === char) {
        this.index += 1;
        return true;
      }
      return false;
    }

    parseExpression() {
      let value = this.parseTerm();
      while (this.peek() === "+" || this.peek() === "-") {
        const operator = this.input[this.index++];
        const next = this.parseTerm();
        value = operator === "+" ? value + next : value - next;
      }
      return value;
    }

    parseTerm() {
      let value = this.parsePower();
      while (this.peek() === "*" || this.peek() === "/") {
        const operator = this.input[this.index++];
        const next = this.parsePower();
        value = operator === "*" ? value * next : value / next;
      }
      return value;
    }

    parsePower() {
      let value = this.parseUnary();
      if (this.consume("^")) {
        value = Math.pow(value, this.parsePower());
      }
      return value;
    }

    parseUnary() {
      if (this.consume("+")) {
        return this.parseUnary();
      }
      if (this.consume("-")) {
        return -this.parseUnary();
      }
      return this.parsePrimary();
    }

    parsePrimary() {
      if (this.consume("(")) {
        const value = this.parseExpression();
        if (!this.consume(")")) {
          throw new Error("Missing parenthesis");
        }
        return value;
      }

      if (this.peek() && /[0-9.]/.test(this.peek())) {
        return this.parseNumber();
      }

      if (this.peek() && /[a-z]/i.test(this.peek())) {
        return this.parseIdentifier();
      }

      throw new Error("Invalid expression");
    }

    parseNumber() {
      const start = this.index;
      while (this.peek() && /[0-9.]/.test(this.peek())) {
        this.index += 1;
      }
      const value = Number(this.input.slice(start, this.index));
      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }
      return value;
    }

    parseIdentifier() {
      const start = this.index;
      while (this.peek() && /[a-z]/i.test(this.peek())) {
        this.index += 1;
      }
      const name = this.input.slice(start, this.index).toLowerCase();

      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (name === "ans") return this.answer;

      if (name === "dms") {
        if (!this.consume("(")) {
          throw new Error("DMS requires parentheses");
        }
        const degrees = this.parseExpression();
        if (!this.consume(",")) throw new Error("Missing DMS minutes");
        const minutes = this.parseExpression();
        if (!this.consume(",")) throw new Error("Missing DMS seconds");
        const seconds = this.parseExpression();
        if (!this.consume(")")) throw new Error("Missing parenthesis");
        return degrees + minutes / 60 + seconds / 3600;
      }

      if (!this.consume("(")) {
        throw new Error("Function requires parentheses");
      }

      const value = this.parseExpression();
      if (!this.consume(")")) {
        throw new Error("Missing parenthesis");
      }

      const trigValue = this.angleMode === "DEG" ? (value * Math.PI) / 180 : value;

      switch (name) {
        case "sin":
          return Math.sin(trigValue);
        case "cos":
          return Math.cos(trigValue);
        case "tan":
          return Math.tan(trigValue);
        case "sqrt":
          return Math.sqrt(value);
        case "log":
          return Math.log10(value);
        case "ln":
          return Math.log(value);
        default:
          throw new Error("Unknown function");
      }
    }
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

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      [x, y] = [y, x % y];
    }
    return x || 1;
  }

  function decimalToFraction(value, maxDenominator = 10000) {
    if (!Number.isFinite(value)) {
      return null;
    }
    const sign = value < 0 ? -1 : 1;
    let x = Math.abs(value);
    if (Math.abs(x - Math.round(x)) < 1e-12) {
      return { numerator: sign * Math.round(x), denominator: 1 };
    }

    let lowerN = 0;
    let lowerD = 1;
    let upperN = 1;
    let upperD = 0;

    while (true) {
      const mediantN = lowerN + upperN;
      const mediantD = lowerD + upperD;
      if (mediantD > maxDenominator) {
        break;
      }
      if (mediantN / mediantD < x) {
        lowerN = mediantN;
        lowerD = mediantD;
      } else {
        upperN = mediantN;
        upperD = mediantD;
      }
    }

    const lower = lowerN / lowerD;
    const upper = upperD ? upperN / upperD : Number.POSITIVE_INFINITY;
    let numerator;
    let denominator;
    if (Math.abs(x - lower) <= Math.abs(upper - x)) {
      numerator = lowerN;
      denominator = lowerD;
    } else {
      numerator = upperN;
      denominator = upperD;
    }

    const divisor = gcd(numerator, denominator);
    return {
      numerator: sign * (numerator / divisor),
      denominator: denominator / divisor,
    };
  }

  function formatFractionValue(value, mixed = false) {
    const fraction = decimalToFraction(value);
    if (!fraction) {
      return "Error";
    }
    const { numerator, denominator } = fraction;
    if (denominator === 1) {
      return String(numerator);
    }
    if (!mixed || Math.abs(numerator) < denominator) {
      return `${numerator}/${denominator}`;
    }

    const sign = numerator < 0 ? "-" : "";
    const absoluteNumerator = Math.abs(numerator);
    const whole = Math.floor(absoluteNumerator / denominator);
    const remainder = absoluteNumerator % denominator;
    if (!remainder) {
      return `${sign}${whole}`;
    }
    return `${sign}${whole} ${remainder}/${denominator}`;
  }

  function normalizeMixedNumbers(value) {
    return value.replace(/(^|[+\-*:/^(])(-?\d+)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (match, prefix, whole, numerator, denominator) => {
      const operator = whole.startsWith("-") ? "-" : "+";
      return `${prefix}(${whole}${operator}${numerator}/${denominator})`;
    });
  }

  function normalizeExpression(value) {
    const normalized = normalizeMixedNumbers(value);
    const functionNames = new Set(["sin", "cos", "tan", "sqrt", "log", "ln", "dms"]);
    const constants = new Set(["pi", "ans", "e"]);
    const tokens = [];
    let index = 0;

    while (index < normalized.length) {
      const char = normalized[index];

      if (/\s/.test(char)) {
        index += 1;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        const start = index;
        while (/[0-9.]/.test(normalized[index] || "")) {
          index += 1;
        }
        tokens.push({ type: "number", value: normalized.slice(start, index) });
        continue;
      }

      if (/[a-z]/i.test(char)) {
        const start = index;
        while (/[a-z]/i.test(normalized[index] || "")) {
          index += 1;
        }
        const word = normalized.slice(start, index);
        const lower = word.toLowerCase();
        tokens.push({
          type: functionNames.has(lower) ? "function" : constants.has(lower) ? "constant" : "identifier",
          value: word,
        });
        continue;
      }

      tokens.push({ type: char === "(" ? "open" : char === ")" ? "close" : "operator", value: char });
      index += 1;
    }

    const canEndTerm = (token) => token && ["number", "constant", "identifier", "close"].includes(token.type);
    const canStartTerm = (token) => token && ["number", "constant", "identifier", "open", "function"].includes(token.type);

    let output = "";
    for (let i = 0; i < tokens.length; i += 1) {
      const current = tokens[i];
      const previous = tokens[i - 1];
      if (canEndTerm(previous) && canStartTerm(current)) {
        output += "*";
      }
      output += current.value;
    }

    return output;
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

  function evaluateExpression(expression, angleMode, answer) {
    return new Parser(expression, angleMode, answer).parse();
  }

  function closeOpenParentheses(expression) {
    let depth = 0;
    for (const char of expression) {
      if (char === "(") {
        depth += 1;
      }
      if (char === ")" && depth > 0) {
        depth -= 1;
      }
    }
    return `${expression}${")".repeat(depth)}`;
  }

  function createCalculator(root) {
    const expressionEl = root.querySelector("[data-expression]");
    const resultEl = root.querySelector("[data-result]");
    const angleLabel = root.querySelector("[data-angle-label]");
    let expression = "";
    let cursor = 0;
    let selectionActive = false;
    let entry = "";
    let stagedEntry = null;
    let resultDisplay = "0";
    let answer = 0;
    let lastValue = 0;
    let resultMode = "decimal";
    let angleMode = "DEG";
    let history = [];
    let historyIndex = null;
    let historyDraft = "";
    let secondActive = false;

    const expressionForDisplay = () => {
      if (!expression) {
        return "";
      }
      if (!selectionActive || cursor >= expression.length) {
        return expression;
      }
      return `${expression.slice(0, cursor)}${SELECT_START}${expression[cursor]}${SELECT_END}${expression.slice(cursor + 1)}`;
    };

    const render = () => {
      expressionEl.innerHTML = formatExpression(expressionForDisplay());
      angleLabel.textContent = angleMode;
      resultEl.innerHTML = formatExpression(resultDisplay || "0");
      root.classList.toggle("is-second-active", secondActive);
      requestAnimationFrame(() => {
        expressionEl.scrollLeft = expressionEl.scrollWidth;
        resultEl.scrollLeft = resultEl.scrollWidth;
      });
    };

    const resultText = (value, mode) => {
      if (mode === "mixed") {
        return formatFractionValue(value, true);
      }
      if (mode === "improper") {
        return formatFractionValue(value, false);
      }
      return formatValue(value);
    };

    const resultModesForValue = (value) => {
      const modes = ["decimal"];
      const improper = formatFractionValue(value, false);
      const mixed = formatFractionValue(value, true);
      if (improper !== "Error" && improper !== formatValue(value)) {
        modes.push("improper");
      }
      if (mixed !== "Error" && mixed !== improper && mixed !== formatValue(value)) {
        modes.push("mixed");
      }
      return modes;
    };

    const stagedText = () => {
      if (!stagedEntry) {
        return "";
      }
      if (stagedEntry.type === "exp") {
        return `${stagedEntry.base}*10^${stagedEntry.exponent}`;
      }
      if (stagedEntry.type === "power") {
        return `${stagedEntry.base}^${stagedEntry.exponent}`;
      }
      if (stagedEntry.type === "dms") {
        const minutes = stagedEntry.minutes || "0";
        const seconds = stagedEntry.seconds || "0";
        if (stagedEntry.part === "minutes") {
          return `${stagedEntry.degrees}°${minutes}`;
        }
        return `${stagedEntry.degrees}°${minutes}'${seconds}`;
      }
      return "";
    };

    const appendExpression = (value) => {
      if (expression.endsWith("=")) {
        expression = "";
        cursor = 0;
        selectionActive = false;
      }
      if (selectionActive && expression) {
        expression = `${expression.slice(0, cursor)}${value}${expression.slice(cursor)}`;
        cursor = Math.max(0, cursor + value.length - 1);
      } else {
        expression += value;
        cursor = Math.max(0, expression.length - 1);
      }
      selectionActive = false;
      historyIndex = null;
    };

    const commitEntry = () => {
      if (stagedEntry) {
        if (stagedEntry.type === "dms") {
          appendExpression(`dms(${stagedEntry.degrees || 0},${stagedEntry.minutes || 0},${stagedEntry.seconds || 0})`);
        } else {
          appendExpression(stagedText());
        }
        stagedEntry = null;
        entry = "";
        resultDisplay = "0";
        return;
      }
      if (!entry) {
        return;
      }
      appendExpression(entry);
      entry = "";
      resultDisplay = "0";
    };

    const commit = () => {
      commitEntry();
      if (!expression) {
        render();
        return;
      }

      const expressionToEvaluate = closeOpenParentheses(
        expression.endsWith("=") ? expression.slice(0, -1) : expression
      );
      try {
        const value = evaluateExpression(expressionToEvaluate, angleMode, answer);
        answer = value;
        lastValue = value;
        expression = `${expressionToEvaluate}=`;
        cursor = Math.max(0, expression.length - 1);
        selectionActive = false;
        history.push({ expression, value });
        if (history.length > 25) {
          history = history.slice(-25);
        }
        historyIndex = null;
        historyDraft = "";
        resultMode = expressionToEvaluate.includes("/") ? "improper" : "decimal";
        resultDisplay = resultText(value, resultMode);
        render();
      } catch (error) {
        resultEl.textContent = "Error";
      }
    };

    const appendEntry = (value) => {
      if (stagedEntry) {
        if (stagedEntry.type === "dms") {
          if (!/^[0-9.]$/.test(value)) {
            return;
          }
          if (stagedEntry.part === "minutes") {
            stagedEntry.minutes = stagedEntry.hasMinutes ? `${stagedEntry.minutes}${value}` : value;
            stagedEntry.hasMinutes = true;
          } else {
            stagedEntry.seconds = stagedEntry.hasSeconds ? `${stagedEntry.seconds}${value}` : value;
            stagedEntry.hasSeconds = true;
          }
          resultDisplay = stagedText();
          historyIndex = null;
          render();
          return;
        }
        if (!/^[0-9]$/.test(value)) {
          return;
        }
        stagedEntry.exponent = stagedEntry.hasExponent ? `${stagedEntry.exponent}${value}` : value;
        stagedEntry.hasExponent = true;
        resultDisplay = stagedText();
        historyIndex = null;
        render();
        return;
      }
      if (value === "." && entry.includes(".")) {
        return;
      }
      if (entry === "0" && value !== ".") {
        entry = value;
      } else {
        entry += value;
      }
      resultDisplay = entry || "0";
      historyIndex = null;
      render();
    };

    const setEntry = (value) => {
      stagedEntry = null;
      if ((value === "pi" || value === "ans" || value === "e") && entry) {
        entry += value;
      } else {
        entry = value;
      }
      resultDisplay = value;
      resultDisplay = entry;
      historyIndex = null;
      render();
    };

    const insertOperator = (operator) => {
      if (expression.endsWith("=")) {
        expression = formatValue(answer);
        cursor = Math.max(0, expression.length - 1);
        selectionActive = false;
      }
      commitEntry();

      if (!expression && operator !== "-") {
        render();
        return;
      }

      if (expression && /[+\-*:^]$/.test(expression) && cursor >= expression.length - 1) {
        expression = `${expression.slice(0, -1)}${operator}`;
        cursor = expression.length - 1;
      } else {
        appendExpression(operator);
      }

      resultDisplay = "0";
      render();
    };

    const insertToken = (value) => {
      if (/^[0-9]$/.test(value) || value === ".") {
        if (expression.endsWith("=")) {
          expression = "";
          cursor = 0;
          selectionActive = false;
        }
        appendEntry(value);
        return;
      }

      if (value === "pi" || value === "e" || value === "ans") {
        if (expression.endsWith("=")) {
          expression = "";
          cursor = 0;
          selectionActive = false;
        }
        setEntry(value);
        return;
      }

      if (value === "+" || value === "-" || value === "*" || value === "/") {
        insertOperator(value === "/" ? DIVIDE_TOKEN : value);
        return;
      }

      if (value === "^" || value === "^2") {
        if (expression.endsWith("=")) {
          expression = formatValue(answer);
          cursor = Math.max(0, expression.length - 1);
          selectionActive = false;
        }
        commitEntry();
        appendExpression(value);
        resultDisplay = "0";
        render();
        return;
      }

      if (value === ")") {
        commitEntry();
        appendExpression(value);
        resultDisplay = "0";
        render();
        return;
      }

      appendExpression(value);
      resultDisplay = "0";
      render();
    };

    const deleteAtCursor = () => {
      if (entry) {
        stagedEntry = null;
        entry = entry.slice(0, -1);
        resultDisplay = entry || "0";
        render();
        return;
      }

      if (!expression) {
        return;
      }
      if (cursor < expression.length) {
        expression = `${expression.slice(0, cursor)}${expression.slice(cursor + 1)}`;
        cursor = Math.max(0, Math.min(cursor - 1, expression.length - 1));
      } else if (cursor > 0) {
        expression = `${expression.slice(0, cursor - 1)}${expression.slice(cursor)}`;
        cursor = Math.max(0, cursor - 2);
      }
      selectionActive = !!expression;
      historyIndex = null;
      render();
    };

    const backspace = () => {
      if (entry) {
        stagedEntry = null;
        entry = entry.slice(0, -1);
        resultDisplay = entry || "0";
        render();
        return;
      }

      if (cursor === 0) {
        return;
      }
      expression = `${expression.slice(0, cursor - 1)}${expression.slice(cursor)}`;
      cursor -= 1;
      historyIndex = null;
      render();
    };

    const moveCursor = (offset) => {
      commitEntry();
      if (!expression) {
        cursor = 0;
      } else {
        cursor = Math.min(Math.max(cursor + offset, 0), expression.length - 1);
        selectionActive = true;
      }
      render();
    };

    const loadHistory = (direction) => {
      if (!history.length) {
        return;
      }

      if (historyIndex === null) {
        historyDraft = expression;
        historyIndex = history.length - 1;
      } else {
        historyIndex += direction;
      }

      if (historyIndex < 0) {
        historyIndex = 0;
      }

      if (historyIndex >= history.length) {
        historyIndex = null;
        expression = historyDraft;
        cursor = Math.max(0, expression.length - 1);
        selectionActive = false;
        render();
        return;
      }

      const item = history[historyIndex];
      expression = item.expression;
      cursor = Math.max(0, expression.length - 1);
      selectionActive = false;
      entry = "";
      resultDisplay = formatValue(item.value);
      render();
    };

    const runAction = (action) => {
      if (action === "noop") {
        return;
      }
      if (action === "second") {
        secondActive = !secondActive;
        render();
        return;
      }
      if (action === "clear" || action === "home") {
        expression = "";
        cursor = 0;
        selectionActive = false;
        entry = "";
        stagedEntry = null;
        resultDisplay = "0";
        resultMode = "decimal";
        historyIndex = null;
        secondActive = false;
        render();
      }
      if (action === "backspace" || action === "delete") {
        deleteAtCursor();
      }
      if (action === "angle") {
        angleMode = angleMode === "DEG" ? "RAD" : "DEG";
        render();
      }
      if (action === "equals") {
        if (secondActive) {
          secondActive = false;
          insertToken("ans");
          return;
        }
        commit();
      }
      if (action === "sign") {
        if (stagedEntry) {
          stagedEntry.exponent = stagedEntry.exponent.startsWith("-")
            ? stagedEntry.exponent.slice(1)
            : `-${stagedEntry.exponent}`;
          resultDisplay = stagedText();
        } else if (entry) {
          entry = entry.startsWith("-") ? entry.slice(1) : `-${entry}`;
          resultDisplay = entry;
        } else {
          entry = "-";
          resultDisplay = entry;
        }
        render();
      }
      if (action === "fraction") {
        if (stagedEntry && (stagedEntry.type === "power" || stagedEntry.type === "exp")) {
          if (stagedEntry.type === "power" && stagedEntry.hasExponent && !stagedEntry.exponent.includes("/")) {
            stagedEntry.exponent += "/";
            resultDisplay = stagedText();
          }
          secondActive = false;
          render();
          return;
        }

        if (expression.endsWith("=")) {
          const modes = resultModesForValue(lastValue);
          const current = modes.indexOf(resultMode);
          resultMode = modes[((current === -1 ? 0 : current) + 1) % modes.length];
          resultDisplay = resultText(lastValue, resultMode);
          secondActive = false;
          render();
          return;
        }

        if (secondActive) {
          stagedEntry = null;
          if (entry && !entry.includes(" ")) {
            entry += " ";
          } else if (entry && entry.includes(" ") && !entry.includes("/")) {
            entry += "/";
          }
          secondActive = false;
        } else if (entry && !entry.includes("/")) {
          stagedEntry = null;
          entry += "/";
        }
        resultDisplay = entry;
        historyIndex = null;
        render();
      }
      if (action === "dms") {
        if (!stagedEntry || stagedEntry.type !== "dms") {
          const degrees = entry || (resultDisplay !== "0" ? resultDisplay : "0");
          stagedEntry = {
            type: "dms",
            degrees,
            minutes: "0",
            seconds: "0",
            part: "minutes",
            hasMinutes: false,
            hasSeconds: false,
          };
          entry = "";
        } else if (stagedEntry.part === "minutes") {
          stagedEntry.part = "seconds";
        }
        resultDisplay = stagedText();
        secondActive = false;
        render();
      }
      if (action === "cursor-left") {
        moveCursor(-1);
      }
      if (action === "cursor-right") {
        moveCursor(1);
      }
      if (action === "history-up") {
        loadHistory(-1);
      }
      if (action === "history-down") {
        loadHistory(1);
      }
      if (action === "exp") {
        const base = entry || (resultDisplay !== "0" ? resultDisplay : "0");
        stagedEntry = { type: "exp", base, exponent: "0", hasExponent: false };
        entry = "";
        resultDisplay = stagedText();
        secondActive = false;
        render();
      }
      if (action === "power") {
        const base = entry || (resultDisplay !== "0" ? resultDisplay : "0");
        stagedEntry = { type: "power", base, exponent: "0", hasExponent: false };
        entry = "";
        resultDisplay = stagedText();
        secondActive = false;
        render();
      }
    };

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !root.contains(button)) {
        return;
      }

      if (button.dataset.insert) {
        insertToken(button.dataset.insert);
      }
      if (button.dataset.action) {
        runAction(button.dataset.action);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (/^[0-9+\-*/().^]$/.test(event.key)) {
        insertToken(event.key);
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        commit();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key === "Delete") {
        event.preventDefault();
        deleteAtCursor();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveCursor(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveCursor(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        loadHistory(-1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        loadHistory(1);
      }
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-scientific-calculator]").forEach(createCalculator);
  });
})();
