(function(host,factory){
  if(typeof module==='object' && module.exports && typeof document==='undefined')
    module.exports=factory(require('./semantic-editor.js'),require('./values.js'),require('./math-engine.js'),require('./numeric-model.js'),require('./formatting.js'));
  else host.ScientificCalculatorCore=factory(host.ScientificCalculatorSemantic,host.ScientificCalculatorValues,host.ScientificCalculatorEngine,host.ScientificCalculatorNumericModel,host.ScientificCalculatorFormatting);
})(globalThis,function(semantic,values,bundle,numericModel,formatting){
  'use strict';
  const engine=bundle.createEngine();
  const {formatValue}=formatting;
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

      const first = this.parseExpression();
      let second = null;
      if (this.consume(",")) {
        second = this.parseExpression();
      }
      if (!this.consume(")")) {
        throw new Error("Missing parenthesis");
      }

      const value = first;
      const inverseTrigResult = (radians) => this.angleMode === "DEG" ? (radians * 180) / Math.PI : radians;
      const requireSingleArgument = () => {
        if (second !== null) {
          throw new Error("Function only accepts one argument");
        }
        return value;
      };
      const requireTwoArguments = () => {
        if (second === null) {
          throw new Error("Function requires two arguments");
        }
        return [value, second];
      };

      switch (name) {
        case "sin":
          return Math.sin(this.angleMode === "DEG" ? (requireSingleArgument() * Math.PI) / 180 : requireSingleArgument());
        case "cos":
          return Math.cos(this.angleMode === "DEG" ? (requireSingleArgument() * Math.PI) / 180 : requireSingleArgument());
        case "tan":
          return Math.tan(this.angleMode === "DEG" ? (requireSingleArgument() * Math.PI) / 180 : requireSingleArgument());
        case "asin":
          return inverseTrigResult(Math.asin(requireSingleArgument()));
        case "acos":
          return inverseTrigResult(Math.acos(requireSingleArgument()));
        case "atan":
          return inverseTrigResult(Math.atan(requireSingleArgument()));
        case "sqrt":
          return Math.sqrt(requireSingleArgument());
        case "cbrt":
          return Math.cbrt(requireSingleArgument());
        case "log":
          return Math.log10(requireSingleArgument());
        case "ln":
          return Math.log(requireSingleArgument());
        case "tenpow":
          return 10 ** requireSingleArgument();
        case "epow":
          return Math.exp(requireSingleArgument());
        case "recip":
          return 1 / requireSingleArgument();
        case "abs":
          return Math.abs(requireSingleArgument());
        case "pct":
          return requireSingleArgument() / 100;
        case "fact":
          return factorialValue(requireSingleArgument());
        case "root": {
          const [index, radicand] = requireTwoArguments();
          return nthRootValue(index, radicand);
        }
        case "ncr": {
          const [n, r] = requireTwoArguments();
          return combinationValue(n, r);
        }
        case "npr": {
          const [n, r] = requireTwoArguments();
          return permutationValue(n, r);
        }
        default:
          throw new Error("Unknown function");
      }
    }
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

  function nonNegativeInteger(value, name) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${name} requires a non-negative integer`);
    }
    return value;
  }

  function factorialValue(value) {
    const n = nonNegativeInteger(value, "Factorial");
    let result = 1;
    for (let factor = 2; factor <= n; factor += 1) {
      result *= factor;
    }
    return result;
  }

  function permutationValue(nValue, rValue) {
    const n = nonNegativeInteger(nValue, "nPr");
    const r = nonNegativeInteger(rValue, "nPr");
    if (r > n) {
      throw new Error("nPr requires r <= n");
    }
    let result = 1;
    for (let factor = n - r + 1; factor <= n; factor += 1) {
      result *= factor;
    }
    return result;
  }

  function combinationValue(nValue, rValue) {
    const n = nonNegativeInteger(nValue, "nCr");
    const r = nonNegativeInteger(rValue, "nCr");
    if (r > n) {
      throw new Error("nCr requires r <= n");
    }
    const smaller = Math.min(r, n - r);
    return permutationValue(n, smaller) / factorialValue(smaller);
  }

  function nthRootValue(index, radicand) {
    if (index === 0) {
      throw new Error("Root index cannot be zero");
    }
    if (radicand < 0 && Number.isInteger(index) && Math.abs(index % 2) === 1) {
      return -((-radicand) ** (1 / index));
    }
    return radicand ** (1 / index);
  }

  function normalizeRational(numerator, denominator = 1) {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
      throw new Error("Invalid rational");
    }
    if (numerator === 0) {
      return { numerator: 0, denominator: 1 };
    }
    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);
    return {
      numerator: sign * numerator / divisor,
      denominator: Math.abs(denominator) / divisor,
    };
  }

  function rationalFromNumberText(value) {
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
      throw new Error("Invalid exact number");
    }
    const sign = value.startsWith("-") ? -1 : 1;
    const unsigned = sign === -1 ? value.slice(1) : value;
    const [whole, decimal = ""] = unsigned.split(".");
    const denominator = 10 ** decimal.length;
    const numerator = sign * (Number(whole || "0") * denominator + Number(decimal || "0"));
    return normalizeRational(numerator, denominator);
  }

  function addRational(left, right) {
    return normalizeRational(
      left.numerator * right.denominator + right.numerator * left.denominator,
      left.denominator * right.denominator
    );
  }

  function multiplyRational(left, right) {
    return normalizeRational(left.numerator * right.numerator, left.denominator * right.denominator);
  }

  function divideRational(left, right) {
    return normalizeRational(left.numerator * right.denominator, left.denominator * right.numerator);
  }

  function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
  }

  function simplifySquareRootInteger(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Invalid exact square root");
    }
    if (value === 0) {
      return { outside: 0, inside: 1 };
    }
    let outside = 1;
    let inside = value;
    for (let factor = 2; factor * factor <= inside; factor += 1) {
      const square = factor * factor;
      while (inside % square === 0) {
        outside *= factor;
        inside /= square;
      }
    }
    return { outside, inside };
  }

  function createExactValue(terms = []) {
    const combined = new Map();
    for (const term of terms) {
      if (!term.coefficient || term.coefficient.numerator === 0) {
        continue;
      }
      const current = combined.get(term.radicand) || normalizeRational(0);
      const next = addRational(current, term.coefficient);
      if (next.numerator === 0) {
        combined.delete(term.radicand);
      } else {
        combined.set(term.radicand, next);
      }
    }
    return { terms: Array.from(combined, ([radicand, coefficient]) => ({ radicand, coefficient })) };
  }

  function exactRational(numerator, denominator = 1) {
    return createExactValue([{ radicand: 1, coefficient: normalizeRational(numerator, denominator) }]);
  }

  function exactRadical(coefficient, radicand) {
    const simplified = simplifySquareRootInteger(radicand);
    return createExactValue([{
      radicand: simplified.inside,
      coefficient: multiplyRational(coefficient, normalizeRational(simplified.outside)),
    }]);
  }

  function negateExact(value) {
    return createExactValue(value.terms.map((term) => ({
      radicand: term.radicand,
      coefficient: normalizeRational(-term.coefficient.numerator, term.coefficient.denominator),
    })));
  }

  function addExact(left, right) {
    return createExactValue([...left.terms, ...right.terms]);
  }

  function subtractExact(left, right) {
    return addExact(left, negateExact(right));
  }

  function multiplyExact(left, right) {
    const terms = [];
    for (const leftTerm of left.terms) {
      for (const rightTerm of right.terms) {
        const radical = simplifySquareRootInteger(leftTerm.radicand * rightTerm.radicand);
        terms.push({
          radicand: radical.inside,
          coefficient: multiplyRational(
            multiplyRational(leftTerm.coefficient, rightTerm.coefficient),
            normalizeRational(radical.outside)
          ),
        });
      }
    }
    return createExactValue(terms);
  }

  function divideExact(left, right) {
    if (right.terms.length !== 1) {
      throw new Error("Unsupported exact division");
    }
    const [denominator] = right.terms;
    if (denominator.coefficient.numerator === 0) {
      throw new Error("Division by zero");
    }
    if (denominator.radicand === 1) {
      return createExactValue(left.terms.map((term) => ({
        radicand: term.radicand,
        coefficient: divideRational(term.coefficient, denominator.coefficient),
      })));
    }

    const rationalizedDenominator = multiplyRational(denominator.coefficient, normalizeRational(denominator.radicand));
    return multiplyExact(left, exactRadical(divideRational(normalizeRational(1), rationalizedDenominator), denominator.radicand));
  }

  function exactSingleRational(value) {
    if (value.terms.length === 0) {
      return normalizeRational(0);
    }
    if (value.terms.length === 1 && value.terms[0].radicand === 1) {
      return value.terms[0].coefficient;
    }
    return null;
  }

  function sqrtExact(value) {
    const rational = exactSingleRational(value);
    if (!rational || rational.numerator < 0) {
      throw new Error("Unsupported exact square root");
    }
    const numeratorSign = rational.numerator < 0 ? -1 : 1;
    const radicand = Math.abs(rational.numerator) * rational.denominator;
    return exactRadical(normalizeRational(numeratorSign, rational.denominator), radicand);
  }

  function integerPowerExact(value, exponent) {
    if (!Number.isInteger(exponent)) {
      throw new Error("Unsupported exact exponent");
    }
    if (exponent === 0) {
      return exactRational(1);
    }
    if (exponent < 0) {
      return divideExact(exactRational(1), integerPowerExact(value, Math.abs(exponent)));
    }
    let result = exactRational(1);
    for (let index = 0; index < exponent; index += 1) {
      result = multiplyExact(result, value);
    }
    return result;
  }

  function formatRationalText(value) {
    if (value.denominator === 1) {
      return String(value.numerator);
    }
    return `${value.numerator}/${value.denominator}`;
  }

  function formatExactTerm(term, first = false) {
    const coefficient = term.coefficient;
    const negative = coefficient.numerator < 0;
    const absolute = normalizeRational(Math.abs(coefficient.numerator), coefficient.denominator);
    const sign = negative ? "-" : first ? "" : "+";

    if (term.radicand === 1) {
      return `${sign}${formatRationalText(absolute)}`;
    }

    const root = `\u221a${term.radicand}`;
    if (absolute.numerator === absolute.denominator) {
      return `${sign}${root}`;
    }
    if (absolute.denominator === 1) {
      return `${sign}${absolute.numerator}${root}`;
    }
    if (absolute.numerator === 1) {
      return `${sign}${root}/${absolute.denominator}`;
    }
    return `${sign}${absolute.numerator}${root}/${absolute.denominator}`;
  }

  function formatExactValue(value) {
    if (!value.terms.length) {
      return "0";
    }
    const sortedTerms = [...value.terms].sort((left, right) => left.radicand - right.radicand);

    const commonDenominator = sortedTerms.reduce(
      (denominator, term) => lcm(denominator, term.coefficient.denominator),
      1
    );
    if (commonDenominator > 1) {
      const numerator = sortedTerms
        .map((term, index) => formatExactTerm({
          radicand: term.radicand,
          coefficient: multiplyRational(term.coefficient, normalizeRational(commonDenominator)),
        }, index === 0))
        .join("");
      return `(${numerator})/${commonDenominator}`;
    }

    return sortedTerms.map((term, index) => formatExactTerm(term, index === 0)).join("");
  }

  function exactTrigValue(name, value, angleMode) {
    if (angleMode !== "DEG") {
      throw new Error("Unsupported exact trig mode");
    }
    const angle = exactSingleRational(value);
    if (!angle || angle.denominator !== 1) {
      throw new Error("Unsupported exact trig angle");
    }
    const normalizedAngle = ((angle.numerator % 360) + 360) % 360;
    const half = () => exactRational(1, 2);
    const negativeHalf = () => exactRational(-1, 2);
    const rootHalf = (radicand, sign = 1) => exactRadical(normalizeRational(sign, 2), radicand);
    const rootThird = (radicand, sign = 1) => exactRadical(normalizeRational(sign, 3), radicand);

    const values = {
      sin: {
        0: exactRational(0), 30: half(), 45: rootHalf(2), 60: rootHalf(3), 90: exactRational(1),
        120: rootHalf(3), 135: rootHalf(2), 150: half(), 180: exactRational(0),
        210: negativeHalf(), 225: rootHalf(2, -1), 240: rootHalf(3, -1), 270: exactRational(-1),
        300: rootHalf(3, -1), 315: rootHalf(2, -1), 330: negativeHalf(),
      },
      cos: {
        0: exactRational(1), 30: rootHalf(3), 45: rootHalf(2), 60: half(), 90: exactRational(0),
        120: negativeHalf(), 135: rootHalf(2, -1), 150: rootHalf(3, -1), 180: exactRational(-1),
        210: rootHalf(3, -1), 225: rootHalf(2, -1), 240: negativeHalf(), 270: exactRational(0),
        300: half(), 315: rootHalf(2), 330: rootHalf(3),
      },
      tan: {
        0: exactRational(0), 30: rootThird(3), 45: exactRational(1), 60: exactRadical(normalizeRational(1), 3),
        120: exactRadical(normalizeRational(-1), 3), 135: exactRational(-1), 150: rootThird(3, -1),
        180: exactRational(0), 210: rootThird(3), 225: exactRational(1), 240: exactRadical(normalizeRational(1), 3),
        300: exactRadical(normalizeRational(-1), 3), 315: exactRational(-1), 330: rootThird(3, -1),
      },
    };

    const result = values[name]?.[normalizedAngle];
    if (!result) {
      throw new Error("Unsupported exact trig value");
    }
    return result;
  }

  class ExactParser {
    constructor(input, angleMode, answer) {
      this.input = normalizeExpression(input).replaceAll(DIVIDE_TOKEN, "/").replace(/\s+/g, "");
      this.angleMode = angleMode;
      this.answer = answer;
      this.index = 0;
      this.usedExactFeature = false;
    }

    parse() {
      const value = this.parseExpression();
      if (this.index < this.input.length) {
        throw new Error("Unexpected exact input");
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
        value = operator === "+" ? addExact(value, next) : subtractExact(value, next);
      }
      return value;
    }

    parseTerm() {
      let value = this.parsePower();
      while (this.peek() === "*" || this.peek() === "/") {
        const operator = this.input[this.index++];
        const next = this.parsePower();
        value = operator === "*" ? multiplyExact(value, next) : divideExact(value, next);
      }
      return value;
    }

    parsePower() {
      let value = this.parseUnary();
      if (this.consume("^")) {
        const exponent = exactSingleRational(this.parsePower());
        if (!exponent || exponent.denominator !== 1) {
          throw new Error("Unsupported exact exponent");
        }
        value = integerPowerExact(value, exponent.numerator);
      }
      return value;
    }

    parseUnary() {
      if (this.consume("+")) {
        return this.parseUnary();
      }
      if (this.consume("-")) {
        return negateExact(this.parseUnary());
      }
      return this.parsePrimary();
    }

    parsePrimary() {
      if (this.consume("(")) {
        const value = this.parseExpression();
        if (!this.consume(")")) {
          throw new Error("Missing exact parenthesis");
        }
        return value;
      }

      if (this.peek() && /[0-9.]/.test(this.peek())) {
        return this.parseNumber();
      }

      if (this.peek() && /[a-z]/i.test(this.peek())) {
        return this.parseIdentifier();
      }

      throw new Error("Invalid exact expression");
    }

    parseNumber() {
      const start = this.index;
      while (this.peek() && /[0-9.]/.test(this.peek())) {
        this.index += 1;
      }
      return createExactValue([{ radicand: 1, coefficient: rationalFromNumberText(this.input.slice(start, this.index)) }]);
    }

    parseIdentifier() {
      const start = this.index;
      while (this.peek() && /[a-z]/i.test(this.peek())) {
        this.index += 1;
      }
      const name = this.input.slice(start, this.index).toLowerCase();

      if (name === "ans") {
        const fraction = decimalToFraction(this.answer, 1000);
        if (!fraction || Math.abs(fraction.numerator / fraction.denominator - this.answer) > 1e-10) {
          throw new Error("Unsupported exact answer");
        }
        return exactRational(fraction.numerator, fraction.denominator);
      }
      if (name === "pi" || name === "e") {
        throw new Error("Unsupported exact constant");
      }

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
        return addExact(addExact(degrees, divideExact(minutes, exactRational(60))), divideExact(seconds, exactRational(3600)));
      }

      if (!this.consume("(")) {
        throw new Error("Exact function requires parentheses");
      }
      const value = this.parseExpression();
      if (!this.consume(")")) {
        throw new Error("Missing exact parenthesis");
      }

      if (name === "sqrt") {
        this.usedExactFeature = true;
        return sqrtExact(value);
      }
      if (["sin", "cos", "tan"].includes(name)) {
        this.usedExactFeature = true;
        return exactTrigValue(name, value, this.angleMode);
      }
      throw new Error("Unsupported exact function");
    }
  }

  function evaluateExactExpression(expression, angleMode, answer) {
    try {
      const parser = new ExactParser(expression, angleMode, answer);
      const value = parser.parse();
      return parser.usedExactFeature ? formatExactValue(value) : null;
    } catch (error) {
      return null;
    }
  }

  function normalizeMixedNumbers(value) {
    return value.replace(/(^|[+\-*:/^(])(-?\d+)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (match, prefix, whole, numerator, denominator) => {
      const operator = whole.startsWith("-") ? "-" : "+";
      return `${prefix}(${whole}${operator}${numerator}/${denominator})`;
    });
  }

  function normalizeExpression(value) {
    const normalized = normalizeMixedNumbers(value);
    const functionNames = new Set([
      "sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "cbrt", "log", "ln",
      "tenpow", "epow", "recip", "abs", "pct", "fact", "root", "ncr", "npr", "dms",
    ]);
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

  function evaluateExpression(expression, angleMode, answer) {
    const ast = semantic.parseTokens(semantic.tokenize(normalizeMixedNumbers(expression).replaceAll(DIVIDE_TOKEN, "/")));
    return semantic.evaluate(ast, legacyNumericAdapter, {angleMode, answer});
  }
  const legacyNumericAdapter = Object.freeze({
    number: text => { const value = Number(text); if (!Number.isFinite(value)) throw new TypeError("Invalid number"); return value; },
    symbol: (name, scope) => {
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (name === "ans") return scope.answer;
      if (Object.hasOwn(scope, name) && typeof scope[name] === "number") return scope[name];
      throw new TypeError("Unbound calculator variable");
    },
    unary: (op, value) => op === "-" ? -value : value,
    binary: (op, a, b) => engine.binary(op, a, b),
    call: (name, args, scope) => {
      const [a,b,c] = args;
      const radians = scope.angleMode === "DEG" ? a*Math.PI/180 : a;
      const inverse = value => scope.angleMode === "DEG" ? value*180/Math.PI : value;
      const calls = {sin:()=>Math.sin(radians),cos:()=>Math.cos(radians),tan:()=>Math.tan(radians),
        asin:()=>inverse(Math.asin(a)),acos:()=>inverse(Math.acos(a)),atan:()=>inverse(Math.atan(a)),
        sqrt:()=>Math.sqrt(a),cbrt:()=>Math.cbrt(a),log:()=>Math.log10(a),ln:()=>Math.log(a),
        tenpow:()=>10**a,epow:()=>Math.exp(a),recip:()=>1/a,abs:()=>Math.abs(a),pct:()=>a/100,
        fact:()=>factorialValue(a),root:()=>nthRootValue(a,b),ncr:()=>combinationValue(a,b),npr:()=>permutationValue(a,b),dms:()=>a+b/60+c/3600};
      if (!Object.hasOwn(calls,name)) throw new TypeError("Calculator function implementation pending");
      return calls[name]();
    },
  });

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

  function createLegacyInitialState() {
    let expression = "";
    let cursor = 0;
    let selectionActive = false;
    let entry = "";
    let stagedEntry = null;
    let resultDisplay = "0";
    let answer = 0;
    let lastValue = 0;
    let lastExactDisplay = "";
    let resultMode = "decimal";
    let angleMode = "DEG";
    let history = [];
    let historyIndex = null;
    let historyDraft = "";
    let secondActive = false;
    let memoryValue = 0;
    let statsValues = [];
    let displayExpression = "";
    let displayResult = "0";
    return { expression, cursor, selectionActive, entry, stagedEntry, resultDisplay, answer, lastValue, lastExactDisplay, resultMode, angleMode, history, historyIndex, historyDraft, secondActive, memoryValue, statsValues, displayExpression, displayResult };
  }

  const ENTRY_PHASES = Object.freeze(["empty", "entering", "editing", "evaluated", "prompt", "menu", "data-entry", "multi-result", "error"]);
  function emptyWorkflow() { return { kind: null, payload: null, page: 0, returnPhase: "empty" }; }
  function initialLayers() { return { alpha: false, hyp: false, inverseHyp: false, mode: "NORMAL", settings: { angle: "DEG", format: "NORM1", tab: 0 }, intent: null }; }
  function editorForState(state) {
    const source = normalizeMixedNumbers(state.expression.replace(/=$/, "") + state.entry);
    let tokens = [];
    try { tokens = semantic.tokenize(source); } catch (error) { if (!(error instanceof TypeError)) throw error; }
    const editor = semantic.createEditor(tokens);
    if (state.selectionActive) {
      let offset = 0;
      for (let index = 0; index < tokens.length; index++) {
        const length = tokens[index].value.length;
        if (state.cursor < offset + length) { editor.cursor = {index,offset:tokens[index].kind === "number" ? state.cursor-offset : 0,path:[]}; break; }
        offset += length;
      }
    }
    if (state.stagedEntry) {
      editor.template = structuredClone(state.stagedEntry);
      editor.cursor.path = ["template", state.stagedEntry.part || (state.stagedEntry.type === "root" ? "radicand" : "exponent")];
      editor.incomplete = true;
    }
    return editor;
  }
  function createInitialState() {
    const state = { ...createLegacyInitialState(), lifecycle: "empty", workflow: emptyWorkflow(), layers: initialLayers() };
    return { ...state, editor: editorForState(state), values: initialValues(state) };
  }
  function initialValues(state) { return {answer:values.scalar(state.answer),last:values.scalar(state.lastValue),memory:values.scalar(state.memoryValue),statistics:{kind:"statistics",rows:state.statsValues.map(x=>({x:values.scalar(x),y:null,weight:1}))},history:state.history.map(h=>values.scalar(h.value))}; }
  function evaluateTypedAst(ast, scope = {}) { return values.evaluateAst(ast, semantic, legacyNumericAdapter, scope); }
  function valuesForState(next, previous, event) {
    const typed = structuredClone(previous.values);
    const evaluated = next.history.length !== previous.history.length || (event.action === "equals" || event.key === "Enter" || event.key === "=") && next.expression.endsWith("=");
    if (evaluated && next.editor.ast && next.displayResult !== "Error") {
      try { typed.answer = evaluateTypedAst(next.editor.ast,{angleMode:next.angleMode,answer:previous.values.answer}); }
      catch { typed.answer = values.scalar(next.answer); }
      typed.last = values.copy(typed.answer);
    } else if (!Object.is(next.answer,previous.answer)) typed.answer = values.scalar(next.answer);
    if (!Object.is(next.lastValue,previous.lastValue) && (!evaluated || next.displayResult === "Error")) typed.last = values.scalar(next.lastValue);
    if (!Object.is(next.memoryValue,previous.memoryValue)) {
      typed.memory = values.scalar(next.memoryValue);
      if (["memory-add","memory-subtract"].includes(event.action)) {
        try {
          const current = previous.editor.ast && !previous.editor.incomplete
            ? evaluateTypedAst(previous.editor.ast,{angleMode:previous.angleMode,answer:previous.values.answer}) : previous.values.last;
          typed.memory = values.binary(event.action === "memory-add" ? "+" : "-",previous.values.memory,current,legacyNumericAdapter.binary);
        } catch { /* preserve characterized legacy nonfinite/error semantics */ }
      }
    }
    if (["memory-clear","home"].includes(event.action)) typed.memory = values.scalar(next.memoryValue);
    typed.statistics = {kind:"statistics",rows:next.statsValues.map((x,i)=>({x:previous.statsValues[i]===x && previous.values.statistics.rows[i]?values.copy(previous.values.statistics.rows[i].x):values.scalar(x),y:null,weight:1}))};
    const historyOffset = evaluated ? Math.max(0,previous.history.length+1-next.history.length) : 0;
    typed.history = next.history.map((h,i)=>i+historyOffset >= previous.history.length ? values.copy(typed.answer) : values.copy(previous.values.history[i+historyOffset]));
    return typed;
  }
  function validateWorkflow(state) {
    const w = state.workflow;
    if (!ENTRY_PHASES.includes(state.lifecycle) || !w
      || Object.keys(w).sort().join() !== "kind,page,payload,returnPhase"
      || !ENTRY_PHASES.includes(w.returnPhase) || !Number.isInteger(w.page) || w.page < 0
      || ![null, "menu", "prompt", "data-entry", "multi-result"].includes(w.kind)) {
      throw new TypeError("Invalid entry lifecycle");
    }
    if (w.kind === null) {
      if (w.payload !== null || w.page !== 0 || ["menu", "prompt", "data-entry", "multi-result"].includes(state.lifecycle)) throw new TypeError("Invalid idle workflow");
    } else {
      if (state.lifecycle !== w.kind || !w.payload || typeof w.payload !== "object") throw new TypeError("Invalid active workflow");
      if (w.kind === "multi-result" && (!Array.isArray(w.payload.pages) || !w.payload.pages.length || w.page >= w.payload.pages.length)) throw new TypeError("Invalid result pages");
      if (w.kind !== "multi-result" && (typeof w.payload.id !== "string" || !w.payload.id)) throw new TypeError("Invalid workflow identity");
    }
  }
  function validateState(state) {
    const initial = createInitialState();
    if (!state || Object.getPrototypeOf(state) !== Object.prototype
      || Object.keys(state).sort().join() !== Object.keys(initial).sort().join()) {
      throw new TypeError("Invalid calculator state fields");
    }
    validateWorkflow(state);
    semantic.validateEditor(state.editor);
    if (state.editor.ast !== null) semantic.validateAst(state.editor.ast);
    if (!state.values || Object.keys(state.values).sort().join() !== "answer,history,last,memory,statistics" || !Array.isArray(state.values.history)
      || state.values.history.length !== state.history.length || state.values.statistics?.kind !== "statistics"
      || state.values.statistics.rows.length !== state.statsValues.length) throw new TypeError("Invalid typed stores");
    for (const name of ["answer","last","memory","statistics"]) values.validate(state.values[name]);
    state.values.history.forEach(value => values.validate(value));
    const layers = state.layers;
    if (!layers || Object.keys(layers).sort().join() !== "alpha,hyp,intent,inverseHyp,mode,settings"
      || !["alpha", "hyp", "inverseHyp"].every(k => typeof layers[k] === "boolean")
      || !["NORMAL", "STAT", "EQN", "CPLX", "MAT", "LIST"].includes(layers.mode)
      || !layers.settings || !["DEG", "RAD", "GRAD"].includes(layers.settings.angle)
      || !["FIX", "SCI", "ENG", "NORM1", "NORM2"].includes(layers.settings.format)
      || !Number.isInteger(layers.settings.tab) || layers.settings.tab < 0 || layers.settings.tab > 9
      || !(layers.intent === null || layers.intent && typeof layers.intent.kind === "string")) throw new TypeError("Invalid key layers");
    for (const name of Object.keys(initial)) {
      if (initial[name] !== null && !Array.isArray(initial[name])
        && typeof state[name] !== typeof initial[name]) throw new TypeError(`Invalid state: ${name}`);
    }
    if (!Number.isInteger(state.cursor) || state.cursor < 0
      || !(state.historyIndex === null || Number.isInteger(state.historyIndex))
      || !["DEG", "RAD"].includes(state.angleMode)
      || !["decimal", "exact", "mixed", "improper"].includes(state.resultMode)
      || !Array.isArray(state.statsValues) || !state.statsValues.every(v => typeof v === "number")
      || !Array.isArray(state.history) || !state.history.every(h => h && typeof h.expression === "string"
        && typeof h.value === "number" && typeof h.exactDisplay === "string")) {
      throw new TypeError("Invalid calculator state values");
    }
    if (state.stagedEntry !== null) {
      const templates = {
        fraction: ["numerator", "denominator", "part"],
        power: ["base", "exponent", "hasExponent"],
        exp: ["base", "exponent", "hasExponent"],
        root: ["index", "radicand", "hasRadicand"],
        binaryFunction: ["name", "left", "right", "hasRight"],
        dms: ["degrees", "minutes", "seconds", "part", "hasMinutes", "hasSeconds"],
      };
      const fields = templates[state.stagedEntry.type];
      if (!fields || Object.keys(state.stagedEntry).sort().join() !== ["type", ...fields].sort().join()
        || !fields.every(name => typeof state.stagedEntry[name] === (name.startsWith("has") ? "boolean" : "string"))) {
        throw new TypeError("Invalid staged entry");
      }
    }
  }

  // In-memory snapshots retain nonfinite numbers; JSON serialization is not
  // part of this contract. Future modes must version and extend these fields.
  function snapshotCalculator(state) {
    validateState(state);
    return { schemaVersion: 5, profile: "legacy-0.3.1", state: structuredClone(state) };
  }

  function restoreCalculator(snapshot) {
    if (!snapshot || ![1, 2, 3, 4, 5].includes(snapshot.schemaVersion) || snapshot.profile !== "legacy-0.3.1"
      || Object.keys(snapshot).sort().join() !== "profile,schemaVersion,state") {
      throw new TypeError("Unsupported calculator snapshot");
    }
    let state = structuredClone(snapshot.state);
    const introduced = {lifecycle:2,workflow:2,layers:3,editor:4,values:5};
    const expectedFields = Object.keys(createInitialState()).filter(name => !introduced[name] || introduced[name] <= snapshot.schemaVersion);
    if (!state || Object.keys(state).sort().join() !== expectedFields.sort().join()) throw new TypeError("Invalid versioned state fields");
    if (snapshot.schemaVersion === 1) {
      if (!state || Object.keys(state).sort().join() !== Object.keys(createLegacyInitialState()).sort().join()) throw new TypeError("Invalid legacy snapshot");
      state = { ...state, lifecycle: inferEntryPhase(state), workflow: emptyWorkflow() };
    }
    if (snapshot.schemaVersion < 3) state.layers = initialLayers();
    if (snapshot.schemaVersion < 4) state.editor = editorForState(state);
    if (snapshot.schemaVersion < 5) state.values = initialValues(state);
    validateState(state);
    return state;
  }

  function inferEntryPhase(state) {
    if (state.displayResult === "Error") return "error";
    if (state.selectionActive) return "editing";
    if (state.expression.endsWith("=")) return "evaluated";
    return state.expression || state.entry || state.stagedEntry ? "entering" : "empty";
  }
  function reduceCalculator(previous, event) {
    validateState(previous);
    if (!event || typeof event.type !== "string") throw new TypeError("Invalid calculator event");
    if (event.type === "physical-key") return reducePhysicalKey(previous, event.id);
    if (event.type === "token-edit") {
      if (previous.workflow.kind !== null) throw new TypeError("Cannot edit during a workflow");
      const next = structuredClone(previous);
      next.editor = semantic.edit(previous.editor, event.command);
      next.expression = semantic.serialize(next.editor.tokens); next.entry = ""; next.stagedEntry = null;
      next.cursor = next.editor.tokens.slice(0,next.editor.cursor.index).reduce((n,t)=>n+t.value.length,0)+next.editor.cursor.offset;
      next.selectionActive = next.editor.cursor.index < next.editor.tokens.length;
      next.displayExpression = next.expression; next.displayResult = "0"; next.resultDisplay = "0";
      next.lifecycle = next.expression ? "editing" : "empty";
      validateState(next); return next;
    }
    if (event.type === "workflow") {
      const next = structuredClone(previous);
      const commands = { "open-menu": "menu", "open-prompt": "prompt", "begin-data": "data-entry", "show-results": "multi-result" };
      if (commands[event.command]) {
        if (previous.workflow.kind !== null) throw new TypeError("Dismiss active workflow before opening another");
        next.workflow = { kind: commands[event.command], payload: structuredClone(event.payload), page: 0, returnPhase: previous.lifecycle };
        next.lifecycle = next.workflow.kind;
      } else if (event.command === "dismiss") {
        next.lifecycle = next.workflow.returnPhase;
        next.workflow = emptyWorkflow();
      } else if (event.command === "page") {
        if (next.workflow.kind !== "multi-result" || ![-1, 1].includes(event.direction)) throw new TypeError("Invalid paging transition");
        next.workflow.page = Math.max(0, Math.min(next.workflow.payload.pages.length - 1, next.workflow.page + event.direction));
      } else throw new TypeError("Unknown workflow transition");
      validateState(next);
      return next;
    }
    if (previous.workflow.kind !== null) {
      if (event.type === "keyboard" && event.key === "Escape" || event.type === "button" && ["clear", "home"].includes(event.action)) {
        return reduceCalculator(previous, { type: "workflow", command: "dismiss" });
      }
      return structuredClone(previous);
    }
    const next = { ...reduceLegacyCalculator(previous, event), workflow: emptyWorkflow(), layers: structuredClone(previous.layers) };
    const effectiveEvent = event.type === 'button' && previous.secondActive && (event.secondInsert || event.secondAction)
      ? {...event,insert:event.secondInsert,action:event.secondAction} : event;
    next.lifecycle = inferEntryPhase(next);
    next.editor = editorForState(next);
    if ((effectiveEvent.key === "Enter" || effectiveEvent.key === "=" || effectiveEvent.action === "equals") && !previous.editor.incomplete && !previous.stagedEntry) {
      next.editor = semantic.createEditor(previous.editor.tokens);
    }
    next.values = valuesForState(next, previous, effectiveEvent);
    if (next.lifecycle === "entering" && (effectiveEvent.key?.startsWith("Arrow") || effectiveEvent.action?.startsWith("cursor-"))) next.lifecycle = "editing";
    validateState(next);
    return next;
  }
  const physicalId = n => `EL506-K${String(n).padStart(2, "0")}`;
  const DIGIT_KEYS = Object.freeze({30:"7",31:"8",32:"9",35:"4",36:"5",37:"6",40:"1",41:"2",42:"3",45:"0"});
  const BASE_KEYS = Object.freeze(Object.fromEntries([
    [1,{action:"home"}], [2,{action:"clear"}], [7,{action:"delete"}], [8,{action:"history-up"}],
    [9,{action:"cursor-left"}], [10,{action:"cursor-right"}], [11,{action:"history-down"}],
    [13,{insert:"sin("}], [14,{insert:"cos("}], [15,{insert:"tan("}], [18,{insert:"pi"}],
    [19,{action:"power"}], [20,{insert:"^2"}], [21,{insert:"^3"}], [22,{insert:"log("}],
    [23,{insert:"ln("}], [24,{action:"exp"}], [25,{action:"fraction"}], [26,{action:"dms"}],
    [29,{action:"memory-add"}], [33,{insert:"("}], [34,{insert:")"}], [38,{insert:"*"}],
    [39,{insert:"/"}], [43,{insert:"+"}], [44,{insert:"-"}], [46,{insert:"."}],
    [47,{action:"sign"}], [48,{action:"equals"}],
    ...Object.entries(DIGIT_KEYS).map(([n,insert]) => [Number(n),{insert}]),
  ]));
  const SECOND_KEYS = Object.freeze({13:{insert:"asin("},14:{insert:"acos("},15:{insert:"atan("},
    18:{insert:"^(-1)"},19:{action:"root"},20:{insert:"sqrt("},21:{insert:"cbrt("},
    22:{insert:"10^("},23:{insert:"e^("},
    29:{action:"memory-subtract"},35:{insert:"!"},36:{action:"ncr"},37:{action:"npr"},40:{insert:"%"}});
  const MEMORY_KEYS = Object.freeze({18:"A",19:"B",20:"C",21:"D",22:"E",23:"F",27:"X",28:"Y",29:"M"});
  const ALPHA_STATS = Object.freeze({30:"mean-y",31:"sample-deviation-y",32:"population-deviation-y",33:"coefficient-a",34:"coefficient-b",35:"mean-x",36:"sample-deviation-x",37:"population-deviation-x",38:"coefficient-c",39:"correlation-r",40:"sum-xy",41:"sum-y",42:"sum-y-squared",45:"count-n",46:"sum-x",47:"sum-x-squared"});
  const KEY_MENUS = Object.freeze({
    MODE: ["NORMAL", "STAT", "EQN", "CPLX", "MAT", "LIST"],
    SETUP: ["ANGLE", "FORMAT", "TAB"], ANGLE: ["DEG", "RAD", "GRAD"],
    FORMAT: ["FIX", "SCI", "ENG", "NORM1", "NORM2"], TAB: ["0","1","2","3","4","5","6","7","8","9"],
    MATH: ["SOLV", "ENG", "TO_SECONDS", "TO_MINUTES"], ENG: ["k", "M", "G", "T", "m", "micro", "n", "p", "f"],
    RANDOM: ["RANDOM", "R_INT", "R_DICE", "R_COIN"], CLEAR: ["MEMORY", "RESET"],
  });
  function resolvePhysicalKey(state, id) {
    if (!/^EL506-K(?:0[1-9]|[1-3][0-9]|4[0-8])$/.test(id)) throw new TypeError("Unknown physical key");
    const n = Number(id.slice(-2));
    const active = state.layers;
    if (n === 1 || n === 2 && !state.secondActive) return { kind:"operation", event: {...BASE_KEYS[n]} };
    if (state.workflow.kind === "menu" || state.workflow.kind === "prompt") {
      if (state.workflow.payload.keyLayer) return {kind:"selection", key:n, digit:DIGIT_KEYS[n], slot:MEMORY_KEYS[n]};
    }
    if (n === 3) return {kind:"modifier", name:"second"};
    if (n === 5 && !state.secondActive) return {kind:"modifier", name:"alpha"};
    if (n === 12) return {kind:"modifier", name:"hyp"};
    if (active.hyp && [13,14,15].includes(n)) return {kind:"function", name: (active.inverseHyp ? "a" : "") + ["sinh","cosh","tanh"][n-13]};
    if (active.alpha) return n === 48 ? {kind:"operation", event:{insert:"ans"}} : MEMORY_KEYS[n] ? {kind:"symbol", name:MEMORY_KEYS[n]} : ALPHA_STATS[n] ? {kind:"statistic", name:ALPHA_STATS[n]} : {kind:"pending", key:id, layer:"ALPHA"};
    if (state.secondActive) {
      if ([24,25].includes(n)) return {kind:"conversion",name:n===24?"fraction-decimal":"mixed-improper"};
      const menu = {4:"CLEAR",5:"STATVAR",17:"ALGB",30:"RANDOM",41:"CNST",42:"CONV",47:"MEMORY_CLEAR"}[n];
      if (menu) return {kind:"menu", name:menu};
      return SECOND_KEYS[n] ? {kind:"operation", event:{...SECOND_KEYS[n]}} : {kind:"pending", key:id, layer:"2ndF"};
    }
    if ([4,6,17,27,28].includes(n)) return {kind:"menu", name:({4:"MODE",6:"SETUP",17:"MATH",27:"RCL",28:"STO"})[n]};
    return BASE_KEYS[n] ? {kind:"operation", event:{...BASE_KEYS[n]}} : {kind:"pending", key:id, layer:"base"};
  }
  function reducePhysicalKey(previous, id) {
    const intent = resolvePhysicalKey(previous, id);
    let next = structuredClone(previous);
    const dismiss = () => { if (next.workflow.kind) next = reduceCalculator(next,{type:"workflow",command:"dismiss"}); };
    const open = name => {
      dismiss(); next.secondActive = false; next.layers.alpha = false; next.layers.hyp = false; next.layers.inverseHyp = false;
      const prompts = ["STO","RCL","SOLV","ALGB","STATVAR","CNST","CONV","MEMORY_CLEAR"];
      next = reduceCalculator(next,{type:"workflow",command:prompts.includes(name)?"open-prompt":"open-menu",payload:{id:name,keyLayer:true,choices:KEY_MENUS[name] || (["STO","RCL"].includes(name)?Object.values(MEMORY_KEYS):[]),path:[]}});
    };
    if (intent.kind === "modifier") {
      if (intent.name === "second") { next.secondActive = !next.secondActive; next.layers.alpha = false; }
      if (intent.name === "alpha") { next.layers.alpha = !next.layers.alpha; next.secondActive = false; }
      if (intent.name === "hyp") { next.layers.hyp = !next.layers.hyp; next.layers.inverseHyp = next.secondActive && next.layers.hyp; }
      next.layers.intent = null;
    } else if (intent.kind === "menu") open(intent.name);
    else if (intent.kind === "selection") {
      const menu = next.workflow.payload.id;
      if (["STO","RCL"].includes(menu)) {
        if (!intent.slot) return next;
        dismiss(); next.layers.intent = {kind:"memory-selection", operation:menu, slot:intent.slot};
      } else if (["CNST", "CONV"].includes(menu) && intent.digit !== undefined) {
        next.workflow.payload.path.push(intent.digit);
        if (next.workflow.payload.path.length === 2) {
          const index = Number(next.workflow.payload.path.join(""));
          if (index < 1 || index > (menu === "CNST" ? 52 : 44)) { next.workflow.payload.path = []; return next; }
          dismiss(); next.layers.intent = {kind:"catalogue-selection", menu, index};
        }
      } else if (intent.digit !== undefined) {
        const choice = next.workflow.payload.choices[Number(intent.digit)];
        if (choice === undefined) return next;
        if (menu === "SETUP" || menu === "MATH" && choice === "ENG") open(choice);
        else {
          dismiss(); next.layers.intent = {kind:"menu-selection", menu, choice};
          if (menu === "MODE") next.layers.mode = choice;
          if (menu === "ANGLE") { next.layers.settings.angle = choice; if (choice !== "GRAD") next.angleMode = choice; }
          if (menu === "FORMAT") next.layers.settings.format = choice;
          if (menu === "TAB") next.layers.settings.tab = Number(choice);
          if (menu === "MATH" && choice === "SOLV") open("SOLV");
        }
      }
    } else {
      if (Number(id.slice(-2)) <= 2 && intent.kind === "operation") {
        dismiss();
        next.layers = { ...initialLayers(), mode: next.layers.mode, settings: structuredClone(next.layers.settings) };
        if (id === "EL506-K01") next.layers.mode = "NORMAL";
        next.secondActive = false;
      }
      else { next.secondActive = false; next.layers.alpha = false; next.layers.hyp = false; next.layers.inverseHyp = false; }
      next.layers.intent = intent;
      if (intent.kind === "operation") {
        if (next.layers.mode !== "NORMAL" && !["clear","home"].includes(intent.event.action)) throw new TypeError("Numeric mode implementation pending");
        next = reduceCalculator(next,{type:"button",...intent.event});
        if (["pi","e","ans"].includes(intent.event.insert) && previous.editor.tokens.length && !previous.expression.endsWith("=") && !previous.stagedEntry) {
          next.editor = semantic.createEditor([...previous.editor.tokens,{kind:"symbol",value:intent.event.insert}]);
        }
      }
      // Semantic intent is retained independently of text. Feature owners
      // implement pending functions, variables, stores and menus later.
    }
    validateState(next);
    return next;
  }
  function reduceLegacyCalculator(previous, event) {
    let { expression, cursor, selectionActive, entry, stagedEntry, resultDisplay, answer, lastValue, lastExactDisplay, resultMode, angleMode, history, historyIndex, historyDraft, secondActive, memoryValue, statsValues, displayExpression, displayResult } = structuredClone(previous);
    const render = () => { displayExpression = expression; displayResult = resultDisplay || "0"; };
    const resultText = (value, mode) => {
      if (mode === "exact") {
        return lastExactDisplay || formatValue(value);
      }
      if (mode === "mixed") {
        return formatFractionValue(value, true);
      }
      if (mode === "improper") {
        return formatFractionValue(value, false);
      }
      return formatValue(value);
    };

    const resultModesForValue = (value) => {
      if (lastExactDisplay) {
        return ["exact", "decimal"];
      }
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

    const showImmediateResult = (value, label = "") => {
      if (!Number.isFinite(value)) {
        displayResult = "Error";
        return;
      }
      answer = value;
      lastValue = value;
      lastExactDisplay = "";
      resultMode = "decimal";
      resultDisplay = formatValue(value);
      expression = label ? `${label}=` : "";
      cursor = Math.max(0, expression.length - 1);
      selectionActive = false;
      entry = "";
      stagedEntry = null;
      historyIndex = null;
      render();
    };

    const currentNumericValue = () => {
      if (entry) {
        return evaluateExpression(closeOpenParentheses(entry), angleMode, answer);
      }
      if (expression && !expression.endsWith("=")) {
        return evaluateExpression(closeOpenParentheses(expression), angleMode, answer);
      }
      return lastValue;
    };

    const applyUnaryFunction = (name) => {
      const target = entry || (expression.endsWith("=") ? formatValue(lastValue) : resultDisplay !== "0" ? resultDisplay : "");
      if (!target) {
        appendExpression(`${name}(`);
        resultDisplay = "0";
      } else {
        if (expression.endsWith("=")) {
          expression = "";
          cursor = 0;
          selectionActive = false;
        }
        entry = `${name}(${target})`;
        stagedEntry = null;
        resultDisplay = entry;
      }
      historyIndex = null;
      secondActive = false;
      render();
    };

    const startBinaryFunction = (name) => {
      const left = entry || (expression.endsWith("=") ? formatValue(lastValue) : resultDisplay !== "0" ? resultDisplay : "0");
      stagedEntry = {
        type: "binaryFunction",
        name,
        left,
        right: "0",
        hasRight: false,
      };
      entry = "";
      resultDisplay = stagedText();
      historyIndex = null;
      secondActive = false;
      render();
    };

    const startRootTemplate = () => {
      const index = entry || (expression.endsWith("=") ? formatValue(lastValue) : resultDisplay !== "0" ? resultDisplay : "0");
      stagedEntry = {
        type: "root",
        index,
        radicand: "0",
        hasRadicand: false,
      };
      entry = "";
      resultDisplay = stagedText();
      historyIndex = null;
      secondActive = false;
      render();
    };

    const stagedEditableField = () => {
      if (!stagedEntry) {
        return null;
      }
      if (stagedEntry.type === "root") {
        return { field: "radicand", flag: "hasRadicand" };
      }
      if (stagedEntry.type === "binaryFunction") {
        return { field: "right", flag: "hasRight" };
      }
      if (stagedEntry.type === "power" || stagedEntry.type === "exp") {
        return { field: "exponent", flag: "hasExponent" };
      }
      return null;
    };

    const updateStagedEditableField = (updater) => {
      const target = stagedEditableField();
      if (!target) {
        return false;
      }
      stagedEntry[target.field] = updater(stagedEntry[target.field] || "");
      stagedEntry[target.flag] = true;
      resultDisplay = stagedText();
      historyIndex = null;
      render();
      return true;
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
      if (stagedEntry.type === "root") {
        return `root(${stagedEntry.index},${stagedEntry.radicand})`;
      }
      if (stagedEntry.type === "binaryFunction") {
        return `${stagedEntry.name}(${stagedEntry.left},${stagedEntry.right})`;
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

    const setFractionPart = (part) => {
      if (stagedEntry?.type !== "fraction") {
        return false;
      }
      stagedEntry.part = part;
      historyIndex = null;
      render();
      return true;
    };

    const currentFractionPart = () => stagedEntry.part;

    const updateCurrentFractionPart = (updater) => {
      const part = currentFractionPart();
      stagedEntry[part] = updater(stagedEntry[part] || "");
      resultDisplay = "";
      historyIndex = null;
      render();
    };

    const appendFractionToken = (value) => {
      if (value === "/") {
        setFractionPart("denominator");
        return;
      }
      updateCurrentFractionPart((current) => `${current}${value === "/" ? DIVIDE_TOKEN : value}`);
    };

    const deleteFractionToken = () => {
      updateCurrentFractionPart((current) => current.slice(0, -1));
    };

    const commitFractionTemplate = () => {
      const numerator = stagedEntry.numerator || "0";
      const denominator = stagedEntry.denominator || "";
      if (!denominator) {
        stagedEntry.part = "denominator";
        render();
        return false;
      }
      appendExpression(`(${numerator})/(${denominator})`);
      stagedEntry = null;
      entry = "";
      resultDisplay = "0";
      return true;
    };

    const finishFractionTemplate = () => {
      if (stagedEntry?.type !== "fraction") {
        return false;
      }
      if (!commitFractionTemplate()) {
        return false;
      }
      render();
      return true;
    };

    const startFractionTemplate = (numerator = "", part = "numerator") => {
      stagedEntry = {
        type: "fraction",
        numerator,
        denominator: "",
        part,
      };
      entry = "";
      resultDisplay = "";
      historyIndex = null;
      secondActive = false;
      render();
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
        } else if (stagedEntry.type === "fraction") {
          if (!commitFractionTemplate()) {
            return;
          }
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
        const exactDisplay = evaluateExactExpression(expressionToEvaluate, angleMode, answer);
        answer = value;
        lastValue = value;
        lastExactDisplay = exactDisplay || "";
        expression = `${expressionToEvaluate}=`;
        cursor = Math.max(0, expression.length - 1);
        selectionActive = false;
        history.push({ expression, value, exactDisplay: lastExactDisplay });
        if (history.length > 25) {
          history = history.slice(-25);
        }
        historyIndex = null;
        historyDraft = "";
        resultMode = exactDisplay ? "exact" : expressionToEvaluate.includes("/") ? "improper" : "decimal";
        resultDisplay = exactDisplay || resultText(value, resultMode);
        render();
      } catch (error) {
        displayResult = "Error";
      }
    };

    const appendEntry = (value) => {
      if (stagedEntry) {
        if (stagedEntry.type === "fraction") {
          appendFractionToken(value);
          return;
        }
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
        const editableTarget = stagedEditableField();
        if (!editableTarget || !/^[0-9.]$/.test(value)) {
          return;
        }
        if (value === "." && (stagedEntry[editableTarget.field] || "").includes(".")) {
          return;
        }
        stagedEntry[editableTarget.field] = stagedEntry[editableTarget.flag]
          ? `${stagedEntry[editableTarget.field]}${value}`
          : value;
        stagedEntry[editableTarget.flag] = true;
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
      if (stagedEntry?.type === "fraction") {
        appendFractionToken(value);
        return;
      }
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
      if (stagedEntry?.type === "fraction") {
        appendFractionToken(operator);
        return;
      }
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
      if (stagedEntry?.type === "fraction") {
        appendFractionToken(value === "/" ? "/" : value);
        return;
      }

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
      if (stagedEntry?.type === "fraction") {
        deleteFractionToken();
        return;
      }
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
      if (stagedEntry?.type === "fraction") {
        deleteFractionToken();
        return;
      }
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
      if (stagedEntry?.type === "fraction") {
        if (offset < 0) {
          setFractionPart("numerator");
          return;
        }
        if (stagedEntry.part === "numerator") {
          setFractionPart("denominator");
          return;
        }
        finishFractionTemplate();
        return;
      }
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
      if (stagedEntry?.type === "fraction") {
        setFractionPart(direction < 0 ? "numerator" : "denominator");
        return;
      }
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
      lastExactDisplay = item.exactDisplay || "";
      resultMode = lastExactDisplay ? "exact" : "decimal";
      resultDisplay = lastExactDisplay || formatValue(item.value);
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
        lastExactDisplay = "";
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
      if (action === "memory-add" || action === "memory-subtract") {
        try {
          const value = currentNumericValue();
          memoryValue += action === "memory-add" ? value : -value;
          secondActive = false;
          showImmediateResult(memoryValue, "M");
        } catch (error) {
          displayResult = "Error";
        }
      }
      if (action === "memory-recall") {
        entry = formatValue(memoryValue);
        resultDisplay = entry;
        stagedEntry = null;
        historyIndex = null;
        secondActive = false;
        render();
      }
      if (action === "memory-clear") {
        memoryValue = 0;
        secondActive = false;
        showImmediateResult(memoryValue, "M");
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
        if (stagedEntry?.type === "fraction") {
          updateCurrentFractionPart((current) => current.startsWith("-") ? current.slice(1) : `-${current}`);
        } else if (stagedEntry) {
          updateStagedEditableField((current) => current.startsWith("-") ? current.slice(1) : `-${current || "0"}`);
        } else if (entry) {
          entry = entry.startsWith("-") ? entry.slice(1) : `-${entry}`;
          resultDisplay = entry;
        } else {
          entry = "-";
          resultDisplay = entry;
        }
        render();
      }
      if (action === "abs") {
        applyUnaryFunction("abs");
      }
      if (action === "percent") {
        applyUnaryFunction("pct");
      }
      if (action === "factorial") {
        applyUnaryFunction("fact");
      }
      if (action === "reciprocal") {
        applyUnaryFunction("recip");
      }
      if (action === "root") {
        startRootTemplate();
      }
      if (action === "ncr") {
        startBinaryFunction("ncr");
      }
      if (action === "npr") {
        startBinaryFunction("npr");
      }
      if (action === "stats-add") {
        try {
          statsValues.push(currentNumericValue());
          secondActive = false;
          showImmediateResult(statsValues.length, "n");
        } catch (error) {
          displayResult = "Error";
        }
      }
      if (action === "stats-sum") {
        secondActive = false;
        showImmediateResult(statsValues.reduce((sum, value) => sum + value, 0), "\u03a3x");
      }
      if (action === "stats-sum-squares") {
        secondActive = false;
        showImmediateResult(statsValues.reduce((sum, value) => sum + value ** 2, 0), "\u03a3x^2");
      }
      if (action === "stats-mean") {
        secondActive = false;
        showImmediateResult(
          statsValues.length ? statsValues.reduce((sum, value) => sum + value, 0) / statsValues.length : 0,
          "xbar"
        );
      }
      if (action === "stats-stddev") {
        const mean = statsValues.length
          ? statsValues.reduce((sum, value) => sum + value, 0) / statsValues.length
          : 0;
        const variance = statsValues.length > 1
          ? statsValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (statsValues.length - 1)
          : 0;
        secondActive = false;
        showImmediateResult(Math.sqrt(variance), "sx");
      }
      if (action === "stats-count") {
        secondActive = false;
        showImmediateResult(statsValues.length, "n");
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
        } else if (entry && entry.includes(" ") && !entry.includes("/")) {
          entry += "/";
        } else if (stagedEntry?.type === "fraction") {
          setFractionPart(stagedEntry.part === "numerator" ? "denominator" : "numerator");
          return;
        } else if (entry && !entry.includes("/")) {
          startFractionTemplate(entry, "denominator");
          return;
        } else if (!entry) {
          startFractionTemplate();
          return;
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

    if (event.type === "button") {
      const useSecond = secondActive && (event.secondInsert || event.secondAction);
      const insert = useSecond ? event.secondInsert : event.insert;
      const action = useSecond ? event.secondAction : event.action;
      if (useSecond) secondActive = false;
      if (insert) insertToken(insert);
      if (action) runAction(action);
    } else if (event.type === "keyboard") {
      const key = event.key;
      if (/^[0-9+\-*/().^]$/.test(key)) insertToken(key);
      else if (key === "Enter" || key === "=") commit();
      else if (key === "Backspace") backspace();
      else if (key === "Delete") deleteAtCursor();
      else if (key === "ArrowLeft") moveCursor(-1);
      else if (key === "ArrowRight") moveCursor(1);
      else if (key === "ArrowUp") loadHistory(-1);
      else if (key === "ArrowDown") loadHistory(1);
    } else throw new TypeError("Unknown calculator event");
    return { expression, cursor, selectionActive, entry, stagedEntry, resultDisplay, answer, lastValue, lastExactDisplay, resultMode, angleMode, history, historyIndex, historyDraft, secondActive, memoryValue, statsValues, displayExpression, displayResult };
  }

  return Object.freeze({
    createInitialState, reduceCalculator, snapshotCalculator, restoreCalculator,
    resolvePhysicalKey, semanticEditor: semantic, valueTypes: values, numericModel,
    evaluateTypedAst, evaluateExpression, evaluateExactExpression, formatValue,
    closeOpenParentheses,
  });
});
