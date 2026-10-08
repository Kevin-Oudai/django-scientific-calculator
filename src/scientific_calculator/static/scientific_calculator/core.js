(function(host,factory){
  if(typeof module==='object' && module.exports && typeof document==='undefined')
    module.exports=factory(require('./semantic-editor.js'),require('./values.js'),require('./math-engine.js'),require('./numeric-model.js'),require('./formatting.js'),require('./catalogues.js'),require('./solver.js'),require('./nbase.js'),require('./calculus.js'),require('./statistics.js'),require('./equations.js'),require('./complex.js'),require('./matrices.js'),require('./lists.js'));
  else host.ScientificCalculatorCore=factory(host.ScientificCalculatorSemantic,host.ScientificCalculatorValues,host.ScientificCalculatorEngine,host.ScientificCalculatorNumericModel,host.ScientificCalculatorFormatting,host.ScientificCalculatorCatalogues,host.ScientificCalculatorSolver,host.ScientificCalculatorNbase,host.ScientificCalculatorCalculus,host.ScientificCalculatorStatistics,host.ScientificCalculatorEquations,host.ScientificCalculatorComplex,host.ScientificCalculatorMatrices,host.ScientificCalculatorLists);
})(globalThis,function(semantic,values,bundle,numericModel,formatting,catalogues,solver,nbase,calculus,statistics,equations,complex,matrices,lists){
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
      const inverseTrigResult = (radians) => this.angleMode === "DEG" ? (radians * 180) / Math.PI : this.angleMode === "GRAD" ? radians*200/Math.PI : radians;
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
          return Math.sin(this.angleMode === "DEG" ? (requireSingleArgument() * Math.PI) / 180 : this.angleMode === "GRAD" ? requireSingleArgument()*Math.PI/200 : requireSingleArgument());
        case "cos":
          return Math.cos(this.angleMode === "DEG" ? (requireSingleArgument() * Math.PI) / 180 : this.angleMode === "GRAD" ? requireSingleArgument()*Math.PI/200 : requireSingleArgument());
        case "tan":
          return Math.tan(this.angleMode === "DEG" ? (requireSingleArgument() * Math.PI) / 180 : this.angleMode === "GRAD" ? requireSingleArgument()*Math.PI/200 : requireSingleArgument());
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
      const radians = scope.angleMode === "DEG" ? a*Math.PI/180 : scope.angleMode === "GRAD" ? a*Math.PI/200 : a;
      const inverse = value => scope.angleMode === "DEG" ? value*180/Math.PI : scope.angleMode === "GRAD" ? value*200/Math.PI : value;
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
  function initialLayers() { return { alpha: false, hyp: false, inverseHyp: false, mode: "NORMAL", settings: { angle: "DEG", format: "NORM1", tab: 9 }, intent: null }; }
  function editorForState(state) {
    const source = normalizeMixedNumbers(state.expression.replace(/=$/, "") + state.entry);
    let tokens = [];
    try { tokens = semantic.tokenize(source,{physical:/E/.test(source)}); } catch (error) { if (!(error instanceof TypeError)) throw error; }
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
  function initialStatistics() { return {parts:[],cursor:null,editing:false,frequencies:[]}; }
  function initialControl() { return {power:"on",idleMs:0,submode:null,errorCode:null,arithmetic:{constant:null,percent:false},nbase:{radix:10},statistics:initialStatistics(),variables:Object.fromEntries(["A","B","C","D","E","F","X","Y"].map(k=>[k,0])),formulas:[[],[],[],[]],matrices:[null,null,null,null],lists:[null,null,null,null],buffers:{matrix:null,list:null}}; }
  function createInitialState() {
    const state = { ...createLegacyInitialState(), lifecycle: "empty", workflow: emptyWorkflow(), layers: initialLayers(), control: initialControl() };
    return { ...state, editor: editorForState(state), values: initialValues(state) };
  }
  function initialValues(state) { return {variables:Object.fromEntries(["A","B","C","D","E","F","X","Y"].map(k=>[k,values.scalar(0)])),answer:values.scalar(state.answer),last:values.scalar(state.lastValue),memory:values.scalar(state.memoryValue),statistics:{kind:"statistics",rows:state.statsValues.map(x=>({x:values.scalar(x),y:null,weight:1}))},history:state.history.map(h=>values.scalar(h.value))}; }
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
    next.control.statistics={...initialStatistics(),frequencies:next.statsValues.map(()=>false)};
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
      if(w.kind==='prompt'&&['ALGB','SOLV'].includes(w.payload.id)){
        const p=w.payload;
        if(typeof p.source!=='string'||p.source.length>10000||typeof p.input!=='string'||p.input.length>24||!Number.isFinite(p.defaultValue))throw new TypeError('Invalid numeric workflow');
        if(p.id==='ALGB'&&(!Array.isArray(p.variables)||!p.variables.length||p.variables.length>9||!p.variables.every(k=>/^[A-FXYM]$/.test(k))||!Number.isInteger(p.index)||p.index<0||p.index>=p.variables.length))throw new TypeError('Invalid simulation workflow');
        if(p.id==='SOLV'){if(!['start','dx'].includes(p.stage)||!Number.isFinite(p.start)||!Number.isFinite(p.dx))throw new TypeError('Invalid solver workflow');semantic.validateAst(p.ast);}
      }
      if(w.kind==='prompt'&&['DERIV','INTEGRAL'].includes(w.payload.id)){
        const p=w.payload,stages=p.id==='DERIV'?['x','dx']:['a','b','n','calculating'];
        if(typeof p.source!=='string'||p.source.length>1000||typeof p.input!=='string'||p.input.length>40||!Number.isFinite(p.defaultValue)||!stages.includes(p.stage)||p.operation!==(p.id==='DERIV'?'derivative':'integral')||!p.conditions||Object.keys(p.conditions).sort().join(',')!=='a,b,dx,n,x'||!Object.values(p.conditions).every(Number.isFinite))throw new TypeError('Invalid calculus workflow');
        semantic.validateAst(p.ast);
        const parsed=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(p.source).replaceAll(':','/'),{physical:true}),{physical:true});
        if(JSON.stringify(parsed)!==JSON.stringify(p.ast)||/(?:random|dice|coin|rint)\(/.test(p.source))throw new TypeError('Invalid calculus expression');
        if(p.stage==='calculating'){calculus.validate(p.job);if(p.job.a!==p.conditions.a||p.job.b!==p.conditions.b||p.job.n!==p.conditions.n)throw new TypeError('Invalid calculus conditions');}
      }
    }
  }
  function validateState(state) {
    const initial = createInitialState();
    if (!state || Object.getPrototypeOf(state) !== Object.prototype
      || Object.keys(state).sort().join() !== Object.keys(initial).sort().join()) {
      throw new TypeError("Invalid calculator state fields");
    }
    validateWorkflow(state);
    const c=state.control;
    if(!c || Object.keys(c).sort().join()!==Object.keys(initialControl()).sort().join()
      || !['on','off'].includes(c.power) || !Number.isFinite(c.idleMs) || c.idleMs<0
      || !(c.submode===null || typeof c.submode==='string') || !(c.errorCode===null || Number.isInteger(c.errorCode)&&c.errorCode>=1&&c.errorCode<=10)
      || Object.keys(c.variables).sort().join()!=='A,B,C,D,E,F,X,Y' || !Object.values(c.variables).every(v=>typeof v==='number'&&Number.isFinite(v))
      || !Array.isArray(c.formulas) || c.formulas.length!==4 || !c.formulas.every(v=>Array.isArray(v))
      || !Array.isArray(c.matrices) || c.matrices.length!==4 || !Array.isArray(c.lists) || c.lists.length!==4) throw new TypeError('Invalid calculator control state');
    if(c.formulas.reduce((n,t)=>n+physicalFormulaLength(t),0)>256)throw new TypeError('Formula memory capacity');
    if(!c.buffers||Object.keys(c.buffers).sort().join()!=='list,matrix')throw new TypeError('Invalid collection buffers');
    for(const [kind,entries]of [['matrix',[...c.matrices,c.buffers.matrix]],['list',[...c.lists,c.buffers.list]]])for(const value of entries)if(value!==null){values.validate(value);if(value.kind!==kind||kind==='matrix'&&(value.rows>4||value.columns>4)||kind==='list'&&(value.elements.length<1||value.elements.length>16)||value.elements.some(x=>!Number.isFinite(values.toNumber(x))||Math.abs(values.toNumber(x))>=1e100))throw new TypeError('Invalid collection slot');}
    if(!c.arithmetic || Object.keys(c.arithmetic).sort().join()!=='constant,percent' || typeof c.arithmetic.percent!=='boolean')throw new TypeError('Invalid arithmetic state');
    const constant=c.arithmetic.constant;
    if(constant!==null && (!constant || Object.keys(constant).sort().join()!=='operand,operator' || !['+','-', '*',':'].includes(constant.operator) || typeof constant.operand!=='string'))throw new TypeError('Invalid constant calculation');
    if(!c.nbase || Object.keys(c.nbase).join()!=='radix'||![2,5,8,10,16].includes(c.nbase.radix))throw new TypeError('Invalid N-base state');
    const stat=c.statistics;
    if(!stat||Object.keys(stat).sort().join()!=='cursor,editing,frequencies,parts'||!Array.isArray(stat.parts)||stat.parts.length>2||!stat.parts.every(p=>typeof p==='string'&&p.length<=142)||typeof stat.editing!=='boolean'||!Array.isArray(stat.frequencies)||stat.frequencies.length!==state.statsValues.length||!stat.frequencies.every(p=>typeof p==='boolean')||!(stat.cursor===null||Number.isInteger(stat.cursor)&&stat.cursor>=0&&stat.cursor<state.statsValues.length*(c.submode==='SD'?2:3)))throw new TypeError('Invalid statistics control');
    if(state.layers.mode==='STAT'&&stat.frequencies.reduce((total,frequency,i)=>total+1+(state.values.statistics.rows[i].y!==null?1:0)+(frequency?1:0),0)>100)throw new TypeError('Statistics data capacity');
    semantic.validateEditor(state.editor);
    if (state.editor.ast !== null) semantic.validateAst(state.editor.ast);
    if (!state.values || Object.keys(state.values).sort().join() !== "answer,history,last,memory,statistics,variables" || !Array.isArray(state.values.history)
      || state.values.history.length !== state.history.length || state.values.statistics?.kind !== "statistics"
      || state.values.statistics.rows.length !== state.statsValues.length) throw new TypeError("Invalid typed stores");
    for (const name of ["answer","last","memory","statistics"]) values.validate(state.values[name]);
    state.values.history.forEach(value => values.validate(value));
    if(!state.values.variables||Object.keys(state.values.variables).sort().join()!=='A,B,C,D,E,F,X,Y')throw new TypeError('Invalid variable stores');
    for(const v of Object.values(state.values.variables)){values.validate(v);if(!['scalar','rational','dms','nbase'].includes(v.kind)||!Number.isFinite(values.toNumber(v)))throw new TypeError('Invalid variable value');}
    const layers = state.layers;
    if (!layers || Object.keys(layers).sort().join() !== "alpha,hyp,intent,inverseHyp,mode,settings"
      || !["alpha", "hyp", "inverseHyp"].every(k => typeof layers[k] === "boolean")
      || !["NORMAL", "STAT", "EQN", "CPLX", "MAT", "LIST"].includes(layers.mode)
      || !layers.settings || !["DEG", "RAD", "GRAD"].includes(layers.settings.angle)
      || !["FIX", "SCI", "ENG", "NORM1", "NORM2"].includes(layers.settings.format)
      || !Number.isInteger(layers.settings.tab) || layers.settings.tab < 0 || layers.settings.tab > 9
      || !(layers.settings.insert === undefined || typeof layers.settings.insert === "boolean")
      || !(layers.intent === null || layers.intent && typeof layers.intent.kind === "string")) throw new TypeError("Invalid key layers");
    if(layers.intent?.kind==='calculus-result'){
      const p=layers.intent;
      if(!['derivative','integral'].includes(p.operation)||typeof p.source!=='string'||p.source.length>1000||!p.conditions||Object.keys(p.conditions).sort().join(',')!=='a,b,dx,n,x'||!Object.values(p.conditions).every(Number.isFinite))throw new TypeError('Invalid calculus result');
      if(p.operation==='integral')calculus.begin(p.conditions.a,p.conditions.b,p.conditions.n);
      else if(p.conditions.dx<=0)throw new TypeError('Invalid derivative conditions');
    }
    for (const name of Object.keys(initial)) {
      if (initial[name] !== null && !Array.isArray(initial[name])
        && typeof state[name] !== typeof initial[name]) throw new TypeError(`Invalid state: ${name}`);
    }
    if (!Number.isInteger(state.cursor) || state.cursor < 0
      || !(state.historyIndex === null || Number.isInteger(state.historyIndex))
      || !["DEG", "RAD", "GRAD"].includes(state.angleMode)
      || !["decimal", "exact", "mixed", "improper"].includes(state.resultMode)
      || !Array.isArray(state.statsValues) || !state.statsValues.every(v => typeof v === "number")
      || !Array.isArray(state.history) || !state.history.every(h => h && typeof h.expression === "string"
        && typeof h.value === "number" && typeof h.exactDisplay === "string")) {
      throw new TypeError("Invalid calculator state values");
    }
    if (state.stagedEntry !== null) {
      const templates = {
        fraction: ["numerator", "denominator", "part"],
        physicalFraction: ["whole", "numerator", "denominator", "part"],
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
    return { schemaVersion: 12, profile: "legacy-0.3.1", state: structuredClone(state) };
  }

  function boundedSnapshot(snapshot) {
    const seen=new WeakSet();let remaining=100000;
    const visit=(value,depth)=>{
      if(--remaining<0||depth>120)throw new TypeError('Snapshot resource limit');
      if(typeof value==='string'){if(value.length>10000)throw new TypeError('Snapshot text limit');return;}
      if(value===null||typeof value==='number'||typeof value==='boolean')return;
      if(typeof value!=='object')throw new TypeError('Invalid snapshot value');
      if(seen.has(value))return;seen.add(value);
      const prototype=Object.getPrototypeOf(value);
      if(prototype!==Object.prototype&&prototype!==Array.prototype&&prototype!==null)throw new TypeError('Invalid snapshot prototype');
      const keys=Reflect.ownKeys(value);if(keys.length>10001)throw new TypeError('Snapshot collection limit');
      for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!Object.hasOwn(descriptor,'value'))throw new TypeError('Invalid snapshot property');visit(descriptor.value,depth+1);}
    };visit(snapshot,0);
  }
  function restoreCalculator(snapshot) {
    boundedSnapshot(snapshot);
    if (!snapshot || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(snapshot.schemaVersion) || snapshot.profile !== "legacy-0.3.1"
      || Object.keys(snapshot).sort().join() !== "profile,schemaVersion,state") {
      throw new TypeError("Unsupported calculator snapshot");
    }
    let state = structuredClone(snapshot.state);
    const introduced = {lifecycle:2,workflow:2,layers:3,editor:4,values:5,control:6};
    const expectedFields = Object.keys(createInitialState()).filter(name => !introduced[name] || introduced[name] <= snapshot.schemaVersion);
    if (!state || Object.keys(state).sort().join() !== expectedFields.sort().join()) throw new TypeError("Invalid versioned state fields");
    if (snapshot.schemaVersion === 1) {
      if (!state || Object.keys(state).sort().join() !== Object.keys(createLegacyInitialState()).sort().join()) throw new TypeError("Invalid legacy snapshot");
      state = { ...state, lifecycle: inferEntryPhase(state), workflow: emptyWorkflow() };
    }
    if (snapshot.schemaVersion < 3) state.layers = initialLayers();
    if (snapshot.schemaVersion < 4) state.editor = editorForState(state);
    if (snapshot.schemaVersion < 5) state.values = initialValues(state);
    if(snapshot.schemaVersion<6) state.control=initialControl();
    if(snapshot.schemaVersion<7) state.control.arithmetic=initialControl().arithmetic;
    if(snapshot.schemaVersion<10)state.control.nbase={radix:10};
    if(snapshot.schemaVersion<12)state.control.buffers={matrix:state.values.last.kind==='matrix'?values.copy(state.values.last):null,list:state.values.last.kind==='list'?values.copy(state.values.last):null};
    if(snapshot.schemaVersion<11)state.control.statistics={...initialStatistics(),frequencies:state.statsValues.map(()=>false)};
    if(snapshot.schemaVersion<9){
      if(snapshot.schemaVersion>=6)state.control.formulas=state.control.formulas.map(t=>semantic.tokenize(t,{physical:true}));
      state.values.variables=Object.fromEntries(Object.entries(state.control.variables).map(([k,v])=>[k,values.scalar(v)]));
    }
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
    if (event.type === "reset") return createInitialState();
    if (event.type === "idle") {
      if(!Number.isFinite(event.elapsedMs)||event.elapsedMs<0) throw new TypeError('Invalid idle interval');
      const next=structuredClone(previous);
      if(next.control.power==='on'){next.control.idleMs+=event.elapsedMs;if(next.control.idleMs>=600000)return physicalPowerOff(next);}
      return next;
    }
    if (event.type === "physical-key") return reducePhysicalKey(previous, event.id, event.randomSample);
    if (event.type === "calculus-step") return physicalCalculusStep(previous);
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
    const next = { ...reduceLegacyCalculator(previous, event), workflow: emptyWorkflow(), layers: structuredClone(previous.layers), control: structuredClone(previous.control) };
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
    [13,{insert:"sin("}], [14,{insert:"cos("}], [15,{insert:"tan("}], [16,{action:"integral"}], [18,{insert:"pi"}],
    [19,{action:"power"}], [20,{insert:"^2"}], [21,{insert:"^3"}], [22,{insert:"log("}],
    [23,{insert:"ln("}], [24,{action:"exp"}], [25,{action:"fraction"}], [26,{action:"dms"}],
    [29,{action:"memory-add"}], [33,{insert:"("}], [34,{insert:")"}], [38,{insert:"*"}],
    [39,{insert:"/"}], [43,{insert:"+"}], [44,{insert:"-"}], [46,{insert:"."}],
    [47,{action:"sign"}], [48,{action:"equals"}],
    ...Object.entries(DIGIT_KEYS).map(([n,insert]) => [Number(n),{insert}]),
  ]));
  const SECOND_KEYS = Object.freeze({13:{insert:"asin("},14:{insert:"acos("},15:{insert:"atan("},16:{action:"derivative"},
    18:{insert:"^(-1)"},19:{action:"root"},20:{insert:"sqrt("},21:{insert:"cbrt("},
    22:{insert:"10^("},23:{insert:"e^("},
    29:{action:"memory-subtract"},35:{insert:"!"},36:{action:"ncr"},37:{action:"npr"},40:{insert:"%"}});
  const MEMORY_KEYS = Object.freeze({18:"A",19:"B",20:"C",21:"D",22:"E",23:"F",27:"X",28:"Y",29:"M"});
  const ALPHA_STATS = Object.freeze({30:"mean-y",31:"sample-deviation-y",32:"population-deviation-y",33:"coefficient-a",34:"coefficient-b",35:"mean-x",36:"sample-deviation-x",37:"population-deviation-x",38:"coefficient-c",39:"correlation-r",40:"sum-xy",41:"sum-y",42:"sum-y-squared",45:"count-n",46:"sum-x",47:"sum-x-squared"});
  const STAT_SYMBOLS=Object.freeze({30:'ymean',31:'sy',32:'sigmay',33:'rega',34:'regb',35:'xmean',36:'sx',37:'sigmax',38:'regc',39:'regr',40:'sumxy',41:'sumy',42:'sumyy',45:'statn',46:'sumx',47:'sumxx'});
  const STAT_LABELS=Object.freeze({ymean:'y\u0305',sy:'Sy',sigmay:'\u03c3y',rega:'a',regb:'b',xmean:'x\u0305',sx:'Sx',sigmax:'\u03c3x',regc:'c',regr:'r',sumxy:'\u03a3xy',sumy:'\u03a3y',sumyy:'\u03a3y\u00b2',statn:'n',sumx:'\u03a3x',sumxx:'\u03a3x\u00b2'});
  const KEY_MENUS = Object.freeze({
    MODE: ["NORMAL", "STAT", "EQN", "CPLX", "MAT", "LIST"],
    SETUP: ["DRG", "FSE", "TAB"], ANGLE: ["DEG", "RAD", "GRAD"],
    FORMAT: ["FIX", "SCI", "ENG", "NORM1", "NORM2"], TAB: ["0","1","2","3","4","5","6","7","8","9"],
    MATH: ["SOLV", "ENG", "→sec", "→min"], ENG: ["k", "M", "G", "T", "m", "µ", "n", "p", "f"],
    RANDOM: ["RAND", "R-DICE", "R-COIN", "R-INT"], CLEAR: ["MEMORY", "RESET"],
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
      if (n === 7) return {kind:"modifier", name:"insert"};
      if ([24,25].includes(n)) return {kind:"conversion",name:n===24?"fraction-decimal":"mixed-improper"};
      const menu = {4:"CLEAR",5:"STATVAR",17:"ALGB",30:"RANDOM",41:"CNST",42:"CONV",47:"MEMORY_CLEAR"}[n];
      if (menu) return {kind:"menu", name:menu};
      return SECOND_KEYS[n] ? {kind:"operation", event:{...SECOND_KEYS[n]}} : {kind:"pending", key:id, layer:"2ndF"};
    }
    if ([4,6,17,27,28].includes(n)) return {kind:"menu", name:({4:"MODE",6:"SETUP",17:"MATH",27:"RCL",28:"STO"})[n]};
    return BASE_KEYS[n] ? {kind:"operation", event:{...BASE_KEYS[n]}} : {kind:"pending", key:id, layer:"base"};
  }
  const MODE_SUBMENUS={STAT:['SD','LINE','QUAD','EXP','LOG','PWR','INV'],EQN:['2-VLE','3-VLE','QUAD','CUBIC']};
  const menuGroups={MODE:[2,2,2],STAT:[3,3,1],EQN:[2,2],CLEAR:[2],MEMORY_CLEAR:[2],SETUP:[3],ANGLE:[3],FORMAT:[3,2],MATH:[2,2],ENG:[4,5],RANDOM:[2,2]};
  function physicalClear(previous,scope='command') {
    const next=createInitialState();next.layers.settings=structuredClone(previous.layers.settings);next.angleMode=previous.angleMode;
    next.layers.mode=previous.layers.mode;next.control=structuredClone(previous.control);next.control.errorCode=null;next.control.idleMs=0;
    next.control.arithmetic=initialControl().arithmetic;
    next.control.statistics={...initialStatistics(),frequencies:scope==='command'?structuredClone(previous.control.statistics.frequencies):[]};
    if(scope!=='command')next.control.nbase={radix:10};
    if(scope==='command'){
      for(const name of ['answer','lastValue','memoryValue','statsValues','values','history'])next[name]=structuredClone(previous[name]);
      if(previous.layers.mode==='EQN' && (previous.workflow.kind==='data-entry'||previous.layers.intent?.kind==='equation-error')){next.workflow=structuredClone(previous.workflow.kind==='data-entry'?previous.workflow:previous.layers.intent.workflow);next.workflow.payload.input='';next.lifecycle='data-entry';}
    }else if(scope==='internal'||scope==='mode'){
      next.memoryValue=previous.memoryValue;next.values.memory=values.copy(previous.values.memory);next.control.formulas=structuredClone(previous.control.formulas);
      if(scope==='mode'&&next.values.memory.kind==='complex')next.values.memory.imaginary=values.scalar(0);
      next.control.variables=initialControl().variables;next.control.matrices=initialControl().matrices;next.control.lists=initialControl().lists;next.control.buffers=initialControl().buffers;
    }else if(scope==='memory'){
      next.control=initialControl();next.control.submode=previous.control.submode;
    }
    next.control.power='on';if(scope==='internal'&&next.layers.mode==='EQN')return physicalEquationStart(next);return next;
  }
  function physicalPowerOff(previous){const next=physicalClear(previous);next.control.power='off';next.secondActive=false;return next;}
  function physicalCells(source){
    const pattern=/(?:random|dice|coin|rint)\(\)|(?:lsortA|lsortD|ldim|lfill|lcumul|ldiff|laug|lmin|lmax|lmean|lmed|lsum|lprod|lstd|lvar|linner|louter|labs|det|trans|dim|fill|identity|rndmat|cumul|aug|conj|polar|statt|probp|probq|probr|cv|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|sqrt|cbrt|recip|tenpow|epow|sin|cos|tan|log|ln|abs|fact|pct)\(|L[1-4]|mat[A-D]|xmean|ymean|sigmax|sigmay|sx|sy|statn|sumxy|sumxx|sumyy|sumx|sumy|rega|regb|regc|regr|ans|pi|\^\(-1\)|\^\d|./g;
    return [...source.matchAll(pattern)].map(m=>({start:m.index,end:m.index+m[0].length,text:m[0]}));
  }
  function physicalLength(source){return physicalCells(source).length;}
  function physicalFormulaLength(tokens){
    if(tokens.some(t=>t.kind==='nbase'))return tokens.reduce((n,t)=>n+(/^[0-9A-F]+$/.test(t.value)?t.value.length:1),0);
    const source=semantic.serialize(tokens).replace(/(?:random|dice|coin|rint)\(\)/g,'0')
      .replace(new RegExp('\\b(?:'+semantic.functions.join('|')+')\\(','g'),'(');
    return physicalLength(source);
  }
  function physicalBufferUsage(source,numericLimit=10){
    // Separate pending calculations from saved left operands. Sharp specifies
    // 24 calculation slots and 10 numeric slots in NORMAL mode.
    const stack=[],precedence={'+':1,'-':1,'*':2,':':2,'/':2,'^':3};
    let calculations=0,numeric=0,operand=false,faultIndex=null;
    const observe=()=>{calculations=Math.max(calculations,stack.length);numeric=Math.max(numeric,stack.filter(x=>x!=='(').length);};
    for(const match of source.matchAll(/(?:[a-z]+\()|\d+(?:\.\d*)?(?:e[+-]?\d+)?|[a-z]+|[^\s]/gi)){
      const token=match[0];
      if(token.endsWith('(')){stack.push('(');operand=false;}
      else if(token===')'){while(stack.length && stack.at(-1)!=='(')stack.pop();if(stack.length)stack.pop();operand=true;}
      else if(Object.hasOwn(precedence,token)){
        if(!operand && (token==='+'||token==='-'))continue;
        while(stack.length && stack.at(-1)!=='(' && (precedence[stack.at(-1)]>precedence[token] || (precedence[stack.at(-1)]===precedence[token]&&token!=='^')))stack.pop();
        stack.push(token);operand=false;
      }else operand=true;
      observe();
      if(faultIndex===null&&(calculations>24||numeric>numericLimit))faultIndex=match.index;
    }
    return {calculations,numeric,faultIndex};
  }
  function physicalEditor(next){if(!next.selectionActive)next.cursor=Math.max(0,next.expression.length-1);next.control.errorCode=null;next.editor=editorForState(next);next.displayExpression=next.expression;next.lifecycle=next.selectionActive?'editing':inferEntryPhase(next);return next;}
  function physicalError(state,code){const next=structuredClone(state);if(typeof code==='string'&&/^EL506-ERROR-\d+$/.test(code))code=Number(code.slice('EL506-ERROR-'.length));next.control.errorCode=code;next.displayResult='Error';next.resultDisplay='Error';next.lifecycle='error';return next;}
  function physicalMenu(previous,id){
    const next=structuredClone(previous);next.secondActive=false;next.layers.alpha=false;next.layers.hyp=false;next.layers.inverseHyp=false;
    next.workflow={kind:'menu',payload:{id,keyLayer:true,choices:structuredClone(id==='MEMORY_CLEAR'?['MEM','RESET']:MODE_SUBMENUS[id]||KEY_MENUS[id]||[]),path:[],selected:0,groups:structuredClone(menuGroups[id]||[2])},page:0,returnPhase:previous.workflow.kind?previous.workflow.returnPhase:previous.lifecycle};
    if(['SETUP','ANGLE','FORMAT'].includes(id)){
      const resume=previous.workflow.payload?.resumeWorkflow||(['multi-result','data-entry'].includes(previous.workflow.kind)?previous.workflow:null);
      if(resume){next.workflow.payload.resumeWorkflow=structuredClone(resume);next.workflow.returnPhase=resume.kind;}
    }
    if(id==='MATH'&&previous.layers.mode==='STAT'){next.workflow.payload.choices=['\u2192t','P(','Q(','R('];next.workflow.payload.groups=[4];}
    if(id==='MATH'&&previous.layers.mode==='CPLX'){next.workflow.payload.choices=['CONJ'];next.workflow.payload.groups=[1];}
    if(id==='MATH'&&previous.layers.mode==='MAT'){next.workflow.payload.choices=['MAT','CHK','STO','OPE','MATH','mat\u2192list','matA\u2192list'];next.workflow.payload.groups=[3,2,1,1];}
    if(id==='MATH'&&previous.layers.mode==='LIST'){next.workflow.payload.choices=['LST','CHK','STO','OPE','MATH','list\u2192mat','list\u2192matA'];next.workflow.payload.groups=[3,2,1,1];}
    if(id==='LIST_SLOTS'){next.workflow.payload.choices=['L1','L2','L3','L4'];next.workflow.payload.groups=[4];}
    if(id==='LIST_OPE'){next.workflow.payload.choices=['sortA','sortD','dim(','fill(','cumul','df_list','aug('];next.workflow.payload.groups=[2,2,1,2];}
    if(id==='LIST_MATH'){next.workflow.payload.choices=['min','max','mean','med','sum','prod','stdDv','vari','o_prod(','i_prod(','abs'];next.workflow.payload.groups=[3,2,2,2,2];}
    if(id==='MAT_SLOTS'){next.workflow.payload.choices=['matA','matB','matC','matD'];next.workflow.payload.groups=[2,2];}
    if(id==='MAT_OPE'){next.workflow.payload.choices=['dim(','fill(','cumul','aug(','identity','rnd_mat('];next.workflow.payload.groups=[2,2,1,1];}
    if(id==='MAT_MATH'){next.workflow.payload.choices=['det','trans'];next.workflow.payload.groups=[2];}
    next.lifecycle='menu';return next;
  }
  function physicalSelect(previous,index){
    if(previous.workflow.payload.id==='RANDOM'){
      const names=['random','dice','coin','rint'],name=names[index];if(!name)return previous;
      let next=structuredClone(previous);next.workflow=emptyWorkflow();next.lifecycle=previous.workflow.returnPhase;
      if(next.lifecycle==='evaluated'){next.expression='';next.entry='';next.stagedEntry=null;}
      try{next=physicalFlush(next);}catch{return physicalError(next,1);}
      next.expression+=name+'()';next.displayResult=next.resultDisplay='0';return physicalEditor(next);
    }
    const id=previous.workflow.payload.id;const choice=previous.workflow.payload.choices[index];if(choice===undefined)return previous;
    if(previous.layers.mode==='LIST'&&['MATH','LIST_SLOTS','LIST_OPE','LIST_MATH'].includes(id))return physicalListSelect(previous,index);
    if(previous.layers.mode==='MAT'&&['MATH','MAT_SLOTS','MAT_OPE','MAT_MATH'].includes(id))return physicalMatrixSelect(previous,index);
    if(id==='MATH'||id==='ENG'){
      if(id==='MATH'&&previous.layers.mode==='CPLX'){let next=structuredClone(previous);next.workflow=emptyWorkflow();next.lifecycle=previous.workflow.returnPhase;next.expression=previous.workflow.returnPhase==='evaluated'?'conj(ans':'conj('; next.entry='';return physicalEditor(next);}
      if(id==='MATH'&&previous.layers.mode==='STAT')return physicalStatisticsMath(previous,index);
      if(id==='MATH'&&index===1)return physicalMenu(previous,'ENG');
      if(id==='MATH'&&index===0)return physicalSolverPrompt(previous,0,1e-5);
      const next=structuredClone(previous);next.workflow=emptyWorkflow();next.lifecycle=previous.workflow.returnPhase;
      try{
        if(id==='MATH'){
          const source=physicalSource(next),ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
          const number=physicalNumeric(semantic.evaluate(ast,physicalAdapter,{angleMode:next.angleMode,answer:next.answer})*(index===2?3600:60));
          const result=physicalCalculate(next,String(number),source,true);result.expression=source+'=';result.editor=editorForState(result);return result;
        }
        const names=['kilo','mega','giga','tera','milli','micro','nano','pico','femto'];
        const source=physicalSource(next),match=source.match(/(?:\([^()]*\)|(?:pi|ans)|-?\d+(?:\.\d*)?)$/);
        if(!match)return physicalError(next,1);
        next.expression=source.slice(0,-match[0].length)+`${names[index]}(${match[0]})`;next.entry='';next.stagedEntry=null;next.displayResult=next.resultDisplay='0';return physicalEditor(next);
      }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
    }
    if(id==='SETUP'){
      if(index===2&&!['FIX','SCI','ENG'].includes(previous.layers.settings.format))return previous;
      if(index!==2)return physicalMenu(previous,index===0?'ANGLE':'FORMAT');
      const next=structuredClone(previous);next.workflow={kind:'prompt',payload:{id:'TAB',label:'TAB(0-9)?',keyLayer:true,...(previous.workflow.payload.resumeWorkflow?{resumeWorkflow:structuredClone(previous.workflow.payload.resumeWorkflow)}:{})},page:0,returnPhase:previous.workflow.returnPhase};next.lifecycle='prompt';return next;
    }
    if(id==='ANGLE'||id==='FORMAT'){
      const next=structuredClone(previous);next.workflow=structuredClone(previous.workflow.payload.resumeWorkflow||emptyWorkflow());next.lifecycle=previous.workflow.returnPhase;
      if(id==='ANGLE'){next.angleMode=choice;next.layers.settings.angle=choice;}else next.layers.settings.format=choice;
      return next;
    }
    if(id==='MODE'){
      if(MODE_SUBMENUS[choice])return physicalMenu(previous,choice);
      const next=physicalClear(previous,'mode');next.layers.mode=choice;next.control.submode=null;
      return next;
    }
    if(id==='STAT'||id==='EQN'){
      const next=physicalClear(previous,'mode');next.layers.mode=id;next.control.submode=choice;
      if(id==='EQN') return physicalEquationStart(next);
      return next;
    }
    if(id==='CLEAR')return physicalClear(previous,'internal');
    if(id==='MEMORY_CLEAR'){
      const next=structuredClone(previous);next.workflow={kind:'prompt',payload:{id:index===0?'CONFIRM_MEMORY_CLEAR':'CONFIRM_RESET',label:index===0?'CLR_MEMORY?':'RESET?',keyLayer:true},page:0,returnPhase:previous.workflow.returnPhase};next.lifecycle='prompt';return next;
    }
    return null;
  }
  function physicalSource(state){
    const s=state.stagedEntry;
    let tail=state.entry;
    if(s){
      if(s.type==='exp')tail=`${s.base}E${(s.exponent||'0').startsWith('-')?'-':''}${(s.exponent||'0').replace('-','').padStart(2,'0')}`;
      else if(s.type==='power'){if(!s.hasExponent)throw new SyntaxError('Missing exponent');const base=/^-/.test(s.base)?`(${s.base})`:s.base;const exponent=/^[\d.]+$/.test(s.exponent)?s.exponent:`(${s.exponent})`;tail=`${base}^${exponent}`;}
      else if(s.type==='root'){if(!s.hasRadicand)throw new SyntaxError('Missing radicand');tail=`root(${s.index},${s.radicand})`;}
      else if(s.type==='binaryFunction'){if(!s.hasRight)throw new SyntaxError('Missing operand');tail=`${s.name}(${s.left},${s.right})`;}
      else if(s.type==='physicalFraction'){if(!s.numerator||!s.denominator||s.part==='invalid')throw new SyntaxError('Incomplete fraction');tail=s.whole?`frac(${s.whole},${s.numerator},${s.denominator})`:`frac(0,${s.numerator},${s.denominator})`;}
      else if(s.type==='fraction')tail=`(${s.numerator})/(${s.denominator})`;
      else if(s.type==='dms')tail=`dms(${s.degrees},${s.minutes||0},${s.seconds||0})`;
    }
    if(/^-[\d.]+(?:E[+-]?\d{2})?$/.test(tail))tail=`(${tail})`;
    return state.expression.replace(/=$/,'')+tail;
  }
  function physicalLastOperand(source){
    if(source.endsWith(')')){
      let depth=0;for(let i=source.length-1;i>=0;i--){if(source[i]===')')depth++;else if(source[i]==='('&&--depth===0){const prefix=source.slice(0,i).match(/[a-z]+$/i);return source.slice(i-(prefix?.[0].length||0));}}
    }
    return source.match(/(?:pi|ans|[A-FXYM]|\d+(?:\.\d*)?(?:E[+-]?\d{1,2})?)$/)?.[0]||null;
  }
  function physicalFlush(state,closeFunctions=true){
    const next=structuredClone(state);next.expression=physicalSource(state);next.entry='';next.stagedEntry=null;
    // A function key supplies an implicit argument; a separately entered '(' is
    // an explicit grouping and stays open until ')' or ENT.
    const stack=[];for(let i=0;i<next.expression.length;i++){if(next.expression[i]==='(')stack.push(/[a-z]$/i.test(next.expression.slice(0,i)));else if(next.expression[i]===')')stack.pop();}
    if(closeFunctions&&!/[a-z]+\($/i.test(next.expression))while(stack.at(-1)===true){next.expression+=')';stack.pop();}
    next.cursor=Math.max(0,next.expression.length-1);next.displayResult=next.resultDisplay='0';return physicalEditor(next);
  }
  function physicalNumeric(value){
    if(!Number.isFinite(value)||Math.abs(value)>=1e100)throw new RangeError('Calculation range');
    return Math.abs(value)<1e-99?0:value;
  }
  const physicalAdapter={...legacyNumericAdapter,
    number:text=>physicalNumeric(Number(text)),
    symbol:(name,scope)=>Object.hasOwn(scope.variables||{},name)?scope.variables[name]:legacyNumericAdapter.symbol(name,scope),
    binary:(op,a,b)=>physicalNumeric(['+','-','*','/'].includes(op)?Number(numericModel.binary(op,String(a),String(b))):legacyNumericAdapter.binary(op,a,b)),
    call:(name,args,scope)=>{
      const [n,r]=args;
      if(name==='frac'){if(r===undefined||args[2]===0)throw new RangeError('Fraction denominator');return physicalNumeric(n<0||Object.is(n,-0)?-(Math.abs(n)+r/args[2]):n+r/args[2]);}
      if(name==='dms')return physicalNumeric((n<0||Object.is(n,-0)?-1:1)*(Math.abs(n)+r/60+args[2]/3600));
      if(['sin','cos','tan'].includes(name)){
        const unit=scope.angleMode,limit=unit==='RAD'?Math.PI/180*1e10:unit==='GRAD'?1e10*10/9:1e10;
        if(Math.abs(n)>=limit)throw new RangeError('Angle range');
        const quarter=unit==='DEG'?90:unit==='GRAD'?100:Math.PI/2,period=quarter*4;
        const reduced=unit==='RAD'?n:n%period;
        const q=reduced/quarter,nearest=Math.round(q),exact=(nearest!==0||reduced===0)&&Math.abs(q-nearest)<=Number.EPSILON*4;
        if(exact){const quadrant=((nearest%4)+4)%4;if(name==='tan'&&quadrant%2)throw new RangeError('Tangent singularity');return name==='sin'?[0,1,0,-1][quadrant]:name==='cos'?[1,0,-1,0][quadrant]:0;}
        const radians=unit==='RAD'?n:reduced*Math.PI/(unit==='DEG'?180:200);
        return physicalNumeric(Math[name](radians));
      }
      if(['sinh','cosh','tanh','asinh','acosh','atanh'].includes(name))return physicalNumeric(Math[name](n));
      if(name==='cv')return physicalNumeric(catalogues.convert(n,r));
      if(['random','dice','coin','rint'].includes(name)){
        const sample=scope.random();
        return name==='random'?Math.floor(sample*1000)/1000:name==='dice'?Math.floor(sample*6)+1:name==='coin'?Math.floor(sample*2):Math.floor(sample*100);
      }
      const units={kilo:3,mega:6,giga:9,tera:12,milli:-3,micro:-6,nano:-9,pico:-12,femto:-15};
      if(Object.hasOwn(units,name))return physicalNumeric(n*10**units[name]);
      if(name==='root'&&n===0)throw new RangeError('Root index');
      if(name==='fact' && (!Number.isInteger(n)||n<0||n>69))throw new RangeError('Factorial domain');
      if(['npr','ncr'].includes(name)){
        if(!Number.isInteger(n)||!Number.isInteger(r)||n<0||r<0||r>n||n>=1e10)throw new RangeError('Combinatorial domain');
        let result=1;const count=name==='ncr'?Math.min(r,n-r):r;
        for(let i=1;i<=count;i++)result=physicalNumeric(result*(n-count+i)/(name==='ncr'?i:1));
        return result;
      }
      return physicalNumeric(legacyNumericAdapter.call(name,args,scope));
    }
  };
  function physicalCalculate(previous,source,display=source,percent=false,randomSample){
    let next=structuredClone(previous);next.secondActive=false;next.layers.alpha=false;next.layers.hyp=false;
    let parsedTokens=null;
    try{
      const closed=closeOpenParentheses(source);
      if(/\dE(?![+-]?\d)/.test(closed)){const error=new SyntaxError('Incomplete scientific literal');error.charIndex=source.length;throw error;}
      const missing=closed.match(/(?:^|[+*:^(:])\+|[+\-*:^:]-|[+*:^:]$/);
      if(missing){const error=new SyntaxError('Missing operand');error.charIndex=missing.index+missing[0].length;throw error;}
      parsedTokens=semantic.tokenize(normalizeMixedNumbers(closed).replaceAll(':','/'),{physical:true});
      const ast=semantic.parseTokens(parsedTokens,{physical:true});
      const draws=[];let cursor=0,seed=Math.floor(Math.abs(previous.control.variables.Y%1)*4294967296)>>>0;
      const random=()=>{if(cursor>=draws.length){seed=(Math.imul(seed,1664525)+1013904223)>>>0;draws.push(draws.length===0&&randomSample!==undefined?randomSample:seed/4294967296);}return draws[cursor++];};
      const adapter=previous.layers.mode==='STAT'?physicalStatisticsAdapter(previous):physicalAdapter;
      const numericResult=semantic.evaluate(ast,adapter,{angleMode:previous.angleMode,answer:previous.answer,variables:physicalVariables(previous),random});
      cursor=0;
      let typed=values.evaluateAst(ast,semantic,adapter,{angleMode:previous.angleMode,answer:previous.values.answer.kind==='nbase'?values.scalar(previous.answer):previous.values.answer,physical:true,random,variables:physicalTypedVariables(previous)});
      const number=numericResult===0?0:physicalNumeric(values.toNumber(typed));
      next.expression=closed+'=';next.displayExpression=display+'=';next.entry='';next.stagedEntry=null;next.selectionActive=false;next.cursor=next.expression.length-1;
      next.answer=next.lastValue=number;next.values.answer=next.values.last=number===0?values.scalar(0):typed;
      if(physicalDmsArithmetic(ast)&&Math.abs(number)<1e6)typed=values.normalizeDms(number);
      next.values.answer=next.values.last=number===0&&typed.kind!=='dms'?values.scalar(0):typed;
      next.lastExactDisplay='';next.resultMode=source.includes('frac(')&&!source.includes('cv(')?'mixed':source.includes('/')&&!/[a-z]+\(/i.test(source)?'improper':'decimal';next.resultDisplay=next.displayResult=formatValue(number);
      if(next.resultMode==='improper')next.resultDisplay=next.displayResult=formatFractionValue(number,false);
      if(typed.kind==='dms')next.resultMode='exact';
      if(source.includes('frac(')&&!source.includes('cv('))physicalFractionView(next,'mixed');
      next.editor=semantic.createEditor(semantic.tokenize(closed.replaceAll(':','/'),{physical:true}));next.editor.ast=ast;next.editor.incomplete=false;
      next.lifecycle='evaluated';next.control.errorCode=null;next.control.arithmetic.percent=percent;
      next.history.push({expression:next.expression,value:number,exactDisplay:''});next.values.history.push(values.copy(next.values.answer));
      while(next.history.length>1&&next.history.reduce((total,h)=>total+physicalLength(h.expression),0)>142){next.history.shift();next.values.history.shift();}
      next.historyIndex=null;if(draws.length)physicalStore(next,'Y',values.scalar(draws.at(-1)));return next;
    }catch(error){
      if(previous.layers.mode==='NORMAL'&&!(error instanceof RangeError)){
        const offset=Number.isInteger(error.charIndex)?error.charIndex:Number.isInteger(error.tokenIndex)&&parsedTokens?semantic.serialize(parsedTokens.slice(0,error.tokenIndex)).length:null;
        if(offset!==null)next.cursor=Math.min(source.length,offset);
      }
      return physicalError(next,error instanceof RangeError?2:1);
    }
  }
  function physicalDmsArithmetic(ast){
    if(ast.kind==='call')return ast.name==='dms';
    if(ast.kind==='binary'&&['+','-','*','/'].includes(ast.operator))return physicalDmsArithmetic(ast.left)||physicalDmsArithmetic(ast.right);
    return ast.kind==='unary'&&physicalDmsArithmetic(ast.operand);
  }
  function physicalFractionView(next,mode){
    const tagged=next.values.last.kind==='rational'?next.values.last:values.decimal(next.lastValue);
    let n=BigInt(tagged.numerator),d=BigInt(tagged.denominator),sign=n<0n?'-':'';n=n<0n?-n:n;
    const whole=n/d,remainder=n%d;
    let text=mode==='mixed'&&whole&&remainder?`${sign}${whole} ${remainder}/${d}`:`${sign}${n}/${d}`;
    const capacity=text.replace('-','').length;
    if(mode==='decimal'||!remainder||capacity>10){next.resultMode='decimal';next.displayResult=next.resultDisplay=formatValue(next.lastValue);}
    else {next.resultMode=mode;next.displayResult=next.resultDisplay=text;}
    return next;
  }
  function physicalStageView(next){
    next=physicalEditor(next);const stage=next.stagedEntry;
    if(stage.type==='physicalFraction')next.displayResult=next.resultDisplay=`${stage.whole?stage.whole+' ':''}${stage.numerator}/${stage.denominator}`;
    else if(stage.type==='dms')next.displayResult=next.resultDisplay=`dms(${stage.degrees},${stage.minutes||0},${stage.seconds||0})`;
    return next;
  }
  function memoryPolicy(mode){
    if(!['NORMAL','STAT','EQN','CPLX','MAT','LIST'].includes(mode))throw new TypeError('Unknown memory mode');
    return {temporary:['NORMAL','MAT','LIST'].includes(mode),independent:['NORMAL','CPLX'].includes(mode),formula:['NORMAL','CPLX'].includes(mode),answer:mode!=='EQN'};
  }
  // Shared result boundary for the later mode controllers. Structured matrix,
  // list and equation pages do not replace the previous usable ANS value.
  function commitTypedResult(previous,value){
    values.validate(value);const next=structuredClone(previous);next.values.last=values.copy(value);
    if(memoryPolicy(previous.layers.mode).answer&&['scalar','rational','dms','nbase','complex'].includes(value.kind)){
      next.values.answer=values.copy(value);next.answer=values.toNumber(value.kind==='complex'?value.real:value);
    }
    next.lastValue=values.toNumber(value.kind==='complex'?value.real:['matrix','list','equation','statistics'].includes(value.kind)?values.scalar(previous.lastValue):value);
    return next;
  }
  function physicalVariables(state){return {...state.control.variables,M:state.memoryValue};}
  function physicalTypedVariables(state){
    return Object.fromEntries(Object.entries(physicalVariables(state)).map(([k,n])=>{
      const tagged=k==='M'?state.values.memory:state.values.variables[k];
      return [k,tagged&&tagged.kind!=='complex'&&!(tagged.kind==='nbase'&&state.control.nbase.radix===10)&&values.toNumber(tagged)===n?values.copy(tagged):values.scalar(n)];
    }));
  }
  function physicalStore(state,slot,value){
    physicalNumeric(values.toNumber(value.kind==='complex'?value.real:value));
    if(value.kind==='complex')physicalNumeric(values.toNumber(value.imaginary));
    if(slot==='M'){state.values.memory=values.copy(value);state.memoryValue=values.toNumber(value.kind==='complex'?value.real:value);}
    else {state.values.variables[slot]=values.copy(value);state.control.variables[slot]=values.toNumber(value);}
  }
  function physicalSolverPrompt(previous,start,dx){
    if(previous.layers.mode!=='NORMAL')return previous;
    const next=structuredClone(previous);
    try{
      const source=previous.layers.intent?.kind==='solver-result'?previous.layers.intent.source:physicalSource(previous);
      const ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
      if(!semantic.serialize(semantic.tokenize(source,{physical:true})).includes('X')||/(?:random|dice|coin|rint)\(/.test(source))throw new SyntaxError('Solver variable');
      next.workflow={kind:'prompt',payload:{id:'SOLV',keyLayer:true,source,stage:'start',start,dx,input:'',defaultValue:start,ast},page:0,returnPhase:'editing'};
      next.lifecycle='prompt';next.secondActive=false;next.layers.alpha=false;return next;
    }catch(error){next.workflow=emptyWorkflow();return physicalError(next,error instanceof RangeError?2:1);}
  }
  function physicalCalculusError(next,error){
    next.workflow=emptyWorkflow();next.secondActive=false;next.layers.alpha=false;
    next=physicalError(next,error instanceof RangeError?2:1);next.layers.intent={kind:'calculus-error'};return next;
  }
  function physicalCalculusPrompt(previous,operation){
    const next=structuredClone(previous);
    try{
      const old=previous.layers.intent?.kind==='calculus-result'&&previous.lifecycle==='evaluated'?previous.layers.intent:null;
      const source=old?old.source:physicalSource(previous);
      if(source.length>1000)throw new RangeError('Calculus expression budget');
      const ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
      if(/(?:random|dice|coin|rint)\(/.test(source))throw new SyntaxError('Calculus random expression');
      const conditions=old?.operation===operation?{...old.conditions}:{x:0,dx:1e-5,a:0,b:0,n:100};
      const stage=operation==='derivative'?'x':'a';
      next.workflow={kind:'prompt',payload:{id:operation==='derivative'?'DERIV':'INTEGRAL',keyLayer:true,source,ast,operation,stage,conditions,input:'',defaultValue:conditions[stage]},page:0,returnPhase:'editing'};
      next.lifecycle='prompt';next.secondActive=false;next.layers.alpha=false;next.layers.hyp=false;return next;
    }catch(error){return physicalCalculusError(next,error);}
  }
  function physicalCalculusEvaluate(state,p,x){
    const scope={angleMode:state.angleMode,answer:state.answer,variables:{...physicalVariables(state),X:x}};
    // Independently captured guide, general-power and quartic derivatives
    // select thirteen-digit operation truncation and fourteen-digit sample
    // truncation. This bounded profile is not a claim about every native function.
    const adapter={...physicalAdapter,binary(op,a,b){
      if(op==='/'&&b===0)throw new RangeError('Calculus division by zero');
      if(['+','-','*','/'].includes(op)||op==='^'&&Number.isInteger(b)&&Math.abs(b)<=1000){
        const exact=engine.decimalBinary(op,String(a),String(b)),bounded=physicalNumeric(Number(exact));
        return bounded===0?0:physicalNumeric(Number(engine.quantize(exact,13,'truncate')));
      }
      return physicalAdapter.binary(op,a,b);
    }};
    return physicalNumeric(Number(engine.quantize(String(physicalNumeric(semantic.evaluate(p.ast,adapter,scope))),14,'truncate')));
  }
  function physicalCalculusComplete(next,p,value){
    next.workflow=emptyWorkflow();physicalStore(next,'X',values.scalar(0));
    next=physicalCalculate(next,String(value),p.source);
    if(next.lifecycle==='error')return physicalCalculusError(next,new RangeError('Calculus result'));
    next.expression=p.source+'=';next.displayExpression=p.operation==='derivative'?'d/dx=':'\u222bdx=';
    next.editor=editorForState(next);next.resultMode='decimal';next.lastExactDisplay='';
    if(next.history.length)next.history.at(-1).expression=next.expression;
    next.layers.intent={kind:'calculus-result',operation:p.operation,source:p.source,conditions:{...p.conditions}};return next;
  }
  function physicalCalculusStep(previous){
    const p=previous.workflow.payload;
    if(previous.control.power!=='on'||previous.workflow.kind!=='prompt'||p?.id!=='INTEGRAL'||p.stage!=='calculating')return previous;
    const next=structuredClone(previous);
    try{
      const progress=calculus.step(x=>physicalCalculusEvaluate(previous,p,x),p.job);
      if(progress.done)return physicalCalculusComplete(next,p,progress.value);
      next.workflow.payload.job=progress.job;return next;
    }catch(error){return physicalCalculusError(next,error);}
  }
  function physicalPhase10(previous,next,n){
    const p=previous.workflow.payload;
    if(previous.workflow.kind==='prompt'&&['DERIV','INTEGRAL'].includes(p?.id)){
      if(p.stage==='calculating')return next;
      let input=p.input;
      if(DIGIT_KEYS[n]!==undefined){if(input.length<40){const part=input.split('/').at(-1),digits=part.split('E').at(-1).replace(/\D/g,'');if(digits.length<(part.includes('E')?2:10))next.workflow.payload.input+=DIGIT_KEYS[n];}return next;}
      if(n===46){const part=input.split('/').at(-1);if(!part.includes('.')&&!part.includes('E'))next.workflow.payload.input+=(part?'':'0')+'.';return next;}
      if(n===24){if(!input.includes('/')&&!input.includes('E'))next.workflow.payload.input=(input||'1')+'E';return next;}
      if(n===25){if(input&&input.split('/').length<3&&!input.includes('E'))next.workflow.payload.input+='/';return next;}
      if(n===7){next.workflow.payload.input=input.slice(0,-1);return next;}
      if(n===47){const at=input.indexOf('E')+1;next.workflow.payload.input=at?input.slice(0,at)+(input[at]==='-'?input.slice(at+1):'-'+input.slice(at)):input?input.startsWith('-')?input.slice(1):'-'+input:p.defaultValue===0?'-0':String(-p.defaultValue);return next;}
      if(n!==48)return next;
      try{
        const number=calculus.condition(p.input,p.defaultValue),q=next.workflow.payload;q.conditions[p.stage]=number;
        const stage=p.stage==='x'?'dx':p.stage==='a'?'b':p.stage==='b'?'n':null;
        if(stage){q.stage=stage;q.input='';q.defaultValue=stage==='dx'?calculus.defaultDx(number):q.conditions[stage];return next;}
        physicalStore(next,'X',values.scalar(0));
        if(p.operation==='derivative')return physicalCalculusComplete(next,q,calculus.derivative(x=>physicalCalculusEvaluate(previous,p,x),q.conditions.x,number,engine));
        q.job=calculus.begin(q.conditions.a,q.conditions.b,number);q.stage='calculating';q.input='';return next;
      }catch(error){physicalStore(next,'X',values.scalar(0));return physicalCalculusError(next,error);}
    }
    if(previous.layers.mode!=='NORMAL'||previous.control.nbase.radix!==10||previous.layers.alpha||previous.layers.hyp||previous.workflow.kind)return null;
    if(n===16)return physicalCalculusPrompt(previous,previous.secondActive?'derivative':'integral');
    if(n===48&&!previous.secondActive&&previous.lifecycle==='evaluated'&&previous.layers.intent?.kind==='calculus-result')return physicalCalculusPrompt(previous,previous.layers.intent.operation);
    return null;
  }
  function physicalSimulationPrompt(previous){
    const next=structuredClone(previous);
    try{
      const source=physicalSource(previous);
      semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
      if(/(?:random|dice|coin|rint)\(/.test(source))throw new SyntaxError('Simulation random');
      const variables=[...new Set(semantic.tokenize(source,{physical:true}).filter(t=>t.kind==='symbol'&&/^[A-FXYM]$/.test(t.value)).map(t=>t.value))];
      if(!variables.length)throw new SyntaxError('Simulation variables');
      next.workflow={kind:'prompt',payload:{id:'ALGB',keyLayer:true,source,variables,index:0,input:'',defaultValue:physicalVariables(previous)[variables[0]]},page:0,returnPhase:'editing'};
      next.lifecycle='prompt';next.secondActive=false;next.layers.alpha=false;return next;
    }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
  }
  function physicalPhase8Prompt(previous,next,n){
    const p=previous.workflow.payload;
    if(previous.workflow.kind!=='prompt'||!['ALGB','SOLV'].includes(p?.id))return null;
    if(DIGIT_KEYS[n]!==undefined){
      const parts=p.input.split('E'),digits=parts.at(-1).replace(/\D/g,''),digit=DIGIT_KEYS[n];
      if(parts.length===2&&digits.length>=2)next.workflow.payload.input=parts[0]+'E'+(parts[1].startsWith('-')?'-':'')+(digits+digit).slice(-2);
      else if(digits.length<(parts.length===2?2:10))next.workflow.payload.input+=digit;
      return next;
    }
    if(n===46){if(!p.input.includes('.')&&!p.input.includes('E'))next.workflow.payload.input+=(p.input?'':'0')+'.';return next;}
    if(n===24){if(!p.input.includes('E'))next.workflow.payload.input=(p.input||'1')+'E';return next;}
    if(n===7){next.workflow.payload.input=p.input.slice(0,-1);return next;}
    if(n===47){const at=p.input.indexOf('E')+1;if(at){next.workflow.payload.input=p.input.slice(0,at)+(p.input[at]==='-'?p.input.slice(at+1):'-'+p.input.slice(at));}else next.workflow.payload.input=p.input?p.input.startsWith('-')?p.input.slice(1):'-'+p.input:String(-p.defaultValue);return next;}
    if(n!==48)return next;
    try{
      if(p.input&& !/^-?\d+(?:\.\d*)?(?:E-?\d+)?$/.test(p.input))throw new SyntaxError('Prompt number');
      const number=physicalNumeric(p.input?Number(p.input):p.defaultValue);
      if(p.id==='ALGB'){
        physicalStore(next,p.variables[p.index],p.input?values.scalar(number):physicalTypedVariables(previous)[p.variables[p.index]]);
        const index=p.index+1;
        if(index<p.variables.length){next.workflow.payload.index=index;next.workflow.payload.input='';next.workflow.payload.defaultValue=physicalVariables(next)[p.variables[index]];return next;}
        next.workflow=emptyWorkflow();return physicalCalculate(next,p.source);
      }
      if(p.stage==='start'){next.workflow.payload.stage='dx';next.workflow.payload.start=number;next.workflow.payload.defaultValue=p.dx;next.workflow.payload.input='';return next;}
      const scope={angleMode:previous.angleMode,answer:previous.answer,variables:physicalVariables(previous)};
      const root=solver.solve(x=>physicalNumeric(semantic.evaluate(p.ast,physicalAdapter,{...scope,variables:{...scope.variables,X:x}})),p.start,number,previous.control.variables.X);
      next.workflow=emptyWorkflow();physicalStore(next,'X',values.scalar(root));
      next=physicalCalculate(next,String(root),p.source);next.expression=p.source+'=';next.displayExpression='X=';next.editor=editorForState(next);
      if(next.history.length)next.history.at(-1).expression=next.expression;
      next.layers.intent={kind:'solver-result',source:p.source,dx:number};return next;
    }catch(error){
      if(p.id==='SOLV')physicalStore(next,'X',values.scalar(0));
      next.workflow=emptyWorkflow();next=physicalError(next,error instanceof RangeError?2:1);
      if(p.id==='SOLV')next.layers.intent={kind:'solver-error'};return next;
    }
  }
  function physicalPhase8(previous,next,intent,n,randomSample){
    const w=previous.workflow,mode=previous.layers.mode;
    if(intent.kind==='symbol'&&!w.kind&&['NORMAL','MAT','LIST'].includes(mode)){
      try{
        if(previous.lifecycle==='evaluated'){next.expression='';next.entry='';next.stagedEntry=null;}
        next=physicalFlush(next,false);next.expression+=intent.name;next.layers.alpha=false;next.secondActive=false;next.control.arithmetic={constant:null,percent:false};return physicalEditor(next);
      }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
    }
    if(previous.secondActive&&n===17&&mode==='NORMAL')return physicalSimulationPrompt(previous);
    if(n===48&&previous.lifecycle==='evaluated'&&previous.layers.intent?.kind==='solver-result')return physicalSolverPrompt(previous,previous.lastValue,previous.layers.intent.dx);
    if(['STO','RCL'].includes(w.payload?.id)){
      const formula={8:0,9:1,10:2,11:3}[n],slot=MEMORY_KEYS[n];
      if(formula===undefined&&!slot)return next;
      const policy=memoryPolicy(mode);
      if(formula!==undefined&&!policy.formula||slot==='M'&&!policy.independent||slot&&slot!=='M'&&!policy.temporary)return next;
      next.workflow=emptyWorkflow();next.lifecycle=w.returnPhase;next.secondActive=false;next.layers.alpha=false;
      try{
        const source=physicalSource(next);
        if(formula!==undefined){
          if(w.payload.id==='STO'){
            const displaySource=next.displayExpression.replace(/=$/,'');
            const storedSource=(w.returnPhase==='evaluated'&&next.displayExpression.endsWith('=')&&closeOpenParentheses(displaySource)===source?displaySource:source)||'0';
            if(physicalLength(storedSource)+1>142)return physicalError(next,4);
            const tokens=semantic.tokenize(storedSource,{physical:true});
            const capacity=next.control.formulas.reduce((total,t,i)=>total+physicalFormulaLength(i===formula?tokens:t),0);
            if(capacity>256)return physicalError(next,6);
            next.control.formulas[formula]=tokens;next.displayExpression=storedSource+'→';next.resultDisplay=next.displayResult='F'+(formula+1);
            next.lifecycle='evaluated';next.layers.intent={kind:'formula-store',slot:formula};return next;
          }
          if(previous.control.formulas[formula].some(t=>t.kind==='nbase'))return physicalError(next,5);
          const recalled=semantic.serialize(previous.control.formulas[formula]);
          if(!recalled)return next;
          next.expression=(w.returnPhase==='evaluated'?'':source)+recalled;next.entry='';next.stagedEntry=null;next.selectionActive=false;next.control.arithmetic={constant:null,percent:false};
          const cells=physicalCells(next.expression);
          if(cells.length>142){next.expression=cells.slice(0,142).map(cell=>cell.text).join('');next.cursor=cells[141].start;next.selectionActive=true;next.displayResult=next.resultDisplay='';}
          return physicalEditor(next);
        }
        if(w.payload.id==='STO'){
          const result=w.returnPhase==='evaluated'?next:mode==='CPLX'?physicalComplexResult(next,source||'0'):physicalCalculate(next,source||'0',source||'0',false,randomSample);
          if(result.lifecycle==='error')return result;
          physicalStore(result,slot,result.values.last);result.displayExpression=(source||'0')+'→'+slot;result.layers.intent={kind:'memory-value',operation:'STO',slot};return result;
        }
        const value=slot==='M'?values.copy(previous.values.memory):physicalTypedVariables(previous)[slot];
        if(source&&w.returnPhase!=='evaluated'){
          next.expression=source+slot;next.entry='';next.stagedEntry=null;next=physicalEditor(next);
          next.resultDisplay=next.displayResult=formatValue(values.toNumber(value.kind==='complex'?value.real:value));return next;
        }
        next.expression=next.displayExpression=slot+'=';next.entry='';next.stagedEntry=null;next.selectionActive=false;
        next.lastValue=values.toNumber(value.kind==='complex'?value.real:value);next.values.last=values.copy(value);next.resultDisplay=next.displayResult=formatValue(next.lastValue);next.resultMode=value.kind==='complex'?'exact':'decimal';next.lifecycle='evaluated';next.editor=editorForState(next);next.layers.intent={kind:'memory-value',operation:'RCL',slot};return next;
      }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
    }
    if(n===29&&!previous.layers.alpha&&!previous.layers.hyp&&['NORMAL','CPLX'].includes(mode)&&!w.kind){
      try{
        const recalled=previous.layers.intent?.kind==='memory-value'&&previous.layers.intent.operation==='RCL';
        const source=previous.lifecycle==='evaluated'?(recalled?previous.layers.intent.slot:'ans'):physicalSource(previous)||'0';
        const result=mode==='CPLX'?previous.lifecycle==='evaluated'?commitTypedResult(next,previous.values.last):physicalComplexResult(next,source):physicalCalculate(next,source,source,false,randomSample);if(result.lifecycle==='error')return result;
        const op=previous.secondActive?'-':'+';
        const numeric=v=>v.kind==='dms'?values.scalar(values.toNumber(v)):v;
        const combine=(a,b)=>values.binary(op,numeric(a),numeric(b),physicalAdapter.binary);
        const a=previous.values.memory,b=result.values.last;
        const combined=a.kind==='complex'||b.kind==='complex'?{kind:'complex',real:combine(a.kind==='complex'?a.real:a,b.kind==='complex'?b.real:b),imaginary:combine(a.kind==='complex'?a.imaginary:values.scalar(0),b.kind==='complex'?b.imaginary:values.scalar(0))}:combine(a,b);
        physicalStore(result,'M',combined);if(result.values.last.kind==='complex')result.resultMode='exact';result.displayExpression=source+(previous.secondActive?'M−':'M+');result.layers.intent={kind:'memory-value',operation:previous.secondActive?'M-':'M+',slot:'M'};return result;
      }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
    }
    return null;
  }
  function physicalPhase7(previous,next,intent,n,randomSample){
    const w=previous.workflow,mode=previous.layers.mode;
    if(w.payload?.id==='CNST'){
      const digit=DIGIT_KEYS[n];if(digit===undefined)return next;
      next.workflow.payload.path.push(digit);
      if(next.workflow.payload.path.length<2)return next;
      const index=Number(next.workflow.payload.path.join('')),row=catalogues.constants[index-1];
      if(!row){next.workflow.payload.path.pop();return next;}
      const resume=w.payload.resumeWorkflow;
      next.workflow=structuredClone(resume||emptyWorkflow());next.lifecycle=resume?.kind||w.returnPhase;
      if(previous.workflow.returnPhase==='evaluated'){next.expression='';next.entry='';next.stagedEntry=null;}
      const value=Number(row.value),literal=Math.abs(value)>=1e8||Math.abs(value)<1e-3?value.toExponential().replace('e','E').replace(/E\+?(-?)(\d+)$/,(_,sign,digits)=>'E'+sign+digits.padStart(2,'0')):String(value);
      next.entry=literal;if(next.workflow.payload?.id==='EQN_COEFFICIENTS')next.workflow.payload.input=literal;next.stagedEntry=null;next.displayResult=next.resultDisplay=formatValue(value);
      next.secondActive=false;next.layers.intent={kind:'catalogue-value',menu:'CNST',index};
      if(!resume)return physicalEditor(next);return next;
    }
    if(w.payload?.id==='CONV'){
      const digit=DIGIT_KEYS[n];
      if(digit!==undefined){if(next.workflow.payload.path.length<10)next.workflow.payload.path.push(digit);return next;}
      if(n===7){next.workflow.payload.path.pop();return next;}
      if(n===48||[38,39,43,44,34].includes(n)){
        const index=Number(next.workflow.payload.path.join('')||'0');
        if(!catalogues.conversions[index-1]){next.workflow=emptyWorkflow();return physicalError(next,2);}
        const source=w.payload.source,operand=physicalLastOperand(source);
        if(!operand){next.workflow=emptyWorkflow();return physicalError(next,1);}
        next.workflow=emptyWorkflow();next.entry='';next.stagedEntry=null;next.expression=source.slice(0,-operand.length)+'cv('+operand+','+index+')';next.lifecycle='entering';
        if(n!==48)return reducePhysicalKey(physicalEditor(next),physicalId(n),randomSample);
        const result=physicalCalculate(next,next.expression,source+'→cv'+index,false,randomSample);
        if(w.payload.resumeWorkflow&&result.lifecycle!=='error'){
          result.workflow=structuredClone(w.payload.resumeWorkflow);result.lifecycle=result.workflow.kind;
          result.entry=String(result.lastValue);if(result.workflow.payload.id==='EQN_COEFFICIENTS')result.workflow.payload.input=result.entry;result.answer=previous.answer;result.values.answer=values.copy(previous.values.answer);result.history=structuredClone(previous.history);result.values.history=structuredClone(previous.values.history);
        }
        return result;
      }
      return next;
    }
    if(previous.secondActive&&[30,41,42].includes(n)&&!previous.layers.alpha){
      const name=n===30?'RANDOM':n===41?'CNST':'CONV';
      if(mode==='CPLX'||name==='RANDOM'&&mode==='EQN'||previous.values.last.kind==='nbase'&&previous.values.last.radix!==10){next.secondActive=false;return next;}
      if(name==='RANDOM')return physicalMenu(previous,name);
      let source;try{source=previous.workflow.payload?.id==='EQN_COEFFICIENTS'?previous.workflow.payload.input:previous.lifecycle==='evaluated'?'ans':physicalSource(previous);}catch{return physicalError(next,1);}
      const resume=w.kind==='data-entry'?structuredClone(w):null;
      next.secondActive=false;next.layers.alpha=false;
      next.workflow={kind:'prompt',payload:{id:name,keyLayer:true,path:[],source,resumeWorkflow:resume},page:0,returnPhase:previous.lifecycle};
      next.lifecycle='prompt';return next;
    }
    if(n===48&&mode!=='NORMAL'&&w.kind===null&&/(?:cv\(|random\(\)|dice\(\)|coin\(\)|rint\(\))/.test(previous.expression)){
      return physicalCalculate(next,physicalSource(previous),physicalSource(previous),false,randomSample);
    }
    return null;
  }
  function physicalFunctionFlush(next){
    const stage=next.stagedEntry;
    if(stage?.type==='physicalFraction'&&!stage.whole&&!stage.denominator&&stage.part==='denominator'){
      next.expression+=(stage.numerator||'0')+'/';next.entry='';next.stagedEntry=null;return next;
    }
    return physicalFlush(next);
  }
  function physicalPhase6(previous,next,intent,n){
    if(previous.layers.mode!=='NORMAL')return null;
    if(previous.workflow.payload?.id==='RCL'&&[27,28].includes(n)){
      const slot=n===27?'X':'Y';next.workflow=emptyWorkflow();next.secondActive=false;next.layers.alpha=false;
      next.expression=slot+'=';next.displayExpression=slot+'=';next.entry='';next.stagedEntry=null;next.selectionActive=false;
      next.lastValue=next.control.variables[slot];next.values.last=values.scalar(next.lastValue);next.displayResult=next.resultDisplay=formatValue(next.lastValue);next.resultMode='decimal';next.lifecycle='evaluated';next.editor=editorForState(next);return next;
    }
    if(previous.workflow.kind!==null)return null;
    if(intent.kind==='function'){
      try{next=physicalFunctionFlush(next);}catch{return physicalError(next,1);}
      if(previous.lifecycle==='evaluated')next.expression='';
      next.expression+=intent.name+'(';next.secondActive=false;next.layers.hyp=false;next.layers.inverseHyp=false;
      next.control.arithmetic={constant:null,percent:false};next.layers.intent=structuredClone(intent);return physicalEditor(next);
    }
    if(previous.layers.alpha)return null;
    const shifted=previous.secondActive,stage=next.stagedEntry;
    if(shifted&&n===24){
      next.secondActive=false;
      if(previous.lifecycle==='evaluated'&&['r=','\u03b8=','x=','y='].includes(previous.displayExpression)){
        const second=['r=','x='].includes(previous.displayExpression),polar=['r=','\u03b8='].includes(previous.displayExpression);
        next.displayExpression=polar?(second?'\u03b8=':'r='):(second?'y=':'x=');next.lastValue=previous.control.variables[second?'Y':'X'];next.values.last=values.scalar(next.lastValue);next.displayResult=next.resultDisplay=formatValue(next.lastValue);
      }
      return next;
    }
    if(stage&&['physicalFraction','dms'].includes(stage.type)&&!shifted){
      const digit=DIGIT_KEYS[n];
      if(digit!==undefined||n===46){
        const part=stage.part;
        if(n===46&&(stage.type==='dms'&&part==='minutes'||stage[part]?.includes('.')))return next;
        if(typeof stage[part]!=='string'||stage[part].replace(/\D/g,'').length>=10)return next;
        if(n===46)stage[part]=(stage[part]||'0')+'.';
        else stage[part]=(stage[part]==='0'?digit:stage[part]+digit);
        if(stage.type==='dms')stage[part==='minutes'?'hasMinutes':'hasSeconds']=true;
        return physicalStageView(next);
      }
      if(n===47){const part=stage.type==='dms'?'degrees':stage.whole?'whole':'numerator';stage[part]=stage[part].startsWith('-')?stage[part].slice(1):'-'+stage[part];return physicalStageView(next);}
      if([9,10].includes(n)&&stage.type==='physicalFraction'){
        next.expression+=`${stage.whole?stage.whole+' ':''}${stage.numerator||'0'}/`;next.entry='';next.stagedEntry=null;next.selectionActive=true;next.cursor=n===9?next.expression.length-1:0;next.displayResult=next.resultDisplay='';return physicalEditor(next);
      }
      if([8,9,10,11].includes(n)){
        const parts=stage.type==='physicalFraction'?(stage.whole?['whole','numerator','denominator']:['numerator','denominator']):['degrees','minutes','seconds'];
        stage.part=parts[Math.max(0,Math.min(parts.length-1,parts.indexOf(stage.part)+([8,9].includes(n)?-1:1)))];return physicalStageView(next);
      }
      if(n===7){const part=stage.part;stage[part]=stage[part].slice(0,-1);return physicalStageView(next);}
    }
    if(n===25){
      next.secondActive=false;
      if(previous.lifecycle==='evaluated'){
        if(shifted)return physicalFractionView(next,previous.resultMode==='improper'?'mixed':'improper');
        return physicalFractionView(next,['mixed','improper'].includes(previous.resultMode)?'decimal':'mixed');
      }
      if(shifted)return next;
      if(stage?.type==='power')return null;
      if(stage?.type==='physicalFraction'){
        if(stage.whole||stage.part==='invalid')stage.part='invalid';
        else{stage.whole=stage.numerator;stage.numerator=stage.denominator;stage.denominator='';stage.part='denominator';}
        return physicalStageView(next);
      }
      let numerator=next.entry;
      if(stage){try{next=physicalFlush(next);}catch{return physicalError(next,1);}}
      if(!numerator&&next.expression){numerator=physicalLastOperand(next.expression);if(numerator)next.expression=next.expression.slice(0,-numerator.length);}
      next.stagedEntry={type:'physicalFraction',whole:'',numerator:numerator||'0',denominator:'',part:'denominator'};next.entry='';next.selectionActive=false;
      return physicalStageView(next);
    }
    if(n===26){
      next.secondActive=false;
      if(shifted||previous.lifecycle==='evaluated'){
        if(previous.lifecycle!=='evaluated'){try{next=physicalCalculate(next,physicalSource(previous));}catch{return physicalError(next,1);}}
        if(next.lifecycle==='error')return next;
        if(next.values.last.kind==='dms'&&next.resultMode!=='decimal'){next.resultMode='decimal';return next;}
        if(Math.abs(next.lastValue)>=1e6)return next;
        next.values.last=values.normalizeDms(next.lastValue);next.resultMode='exact';return next;
      }
      if(stage?.type==='dms'){stage.part='seconds';return physicalStageView(next);}
      if(next.entry.includes('.'))return next;
      next.stagedEntry={type:'dms',degrees:next.entry||'0',minutes:'',seconds:'',part:'minutes',hasMinutes:false,hasSeconds:false};next.entry='';return physicalStageView(next);
    }
    if(shifted&&n===46){
      try{
        const source=previous.lifecycle==='evaluated'?'ans':physicalSource(previous),units=['DEG','RAD','GRAD'];
        const from=previous.angleMode,to=units[(units.indexOf(from)+1)%3];
        const ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source),{physical:true}),{physical:true});
        const number=semantic.evaluate(ast,physicalAdapter,{angleMode:from,answer:previous.answer,variables:physicalVariables(previous)});
        const degrees=from==='RAD'?number*180/Math.PI:from==='GRAD'?number*.9:number;
        const result=physicalCalculate(next,String(to==='RAD'?degrees*Math.PI/180:to==='GRAD'?degrees*10/9:degrees),source+' to '+to);
        if(result.lifecycle==='error')return result;
        result.angleMode=result.layers.settings.angle=to;result.expression=source+'=';result.displayExpression=source+' to '+to;result.editor=editorForState(result);result.control.arithmetic={constant:null,percent:true};result.history.at(-1).expression=result.expression;return result;
      }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
    }
    if(shifted&&n===28){try{next=physicalFlush(next);}catch{return physicalError(next,1);}next.expression+=',';next.secondActive=false;return physicalEditor(next);}
    if(shifted&&[31,32].includes(n)){
      try{
        const source=physicalSource(previous),tokens=semantic.tokenize(closeOpenParentheses(source),{physical:true});
        let depth=0,separators=[];tokens.forEach((token,i)=>{if(token.value==='(')depth++;if(token.value===')')depth--;if(token.value===','&&depth===0)separators.push(i);});
        if(separators.length!==1)throw new SyntaxError('Coordinate pair');
        const at=separators[0],scope={angleMode:previous.angleMode,answer:previous.answer,variables:physicalVariables(previous)};
        const a=semantic.evaluate(semantic.parseTokens(tokens.slice(0,at),{physical:true}),physicalAdapter,scope),b=semantic.evaluate(semantic.parseTokens(tokens.slice(at+1),{physical:true}),physicalAdapter,scope);
        let first,second;
        if(n===31){if(a===0&&b===0)throw new RangeError('Origin polar angle');first=Math.hypot(a,b);second=Math.atan2(b,a)*(scope.angleMode==='DEG'?180/Math.PI:scope.angleMode==='GRAD'?200/Math.PI:1);}
        else {if(a<0)throw new RangeError('Polar radius');first=a*physicalAdapter.call('cos',[b],scope);second=a*physicalAdapter.call('sin',[b],scope);}
        first=physicalNumeric(first);second=physicalNumeric(second);
        const result=physicalCalculate(next,String(first),n===31?'r':'x');if(result.lifecycle==='error')return result;
        result.expression=source+'=';result.displayExpression=n===31?'r=':'x=';result.editor=editorForState(result);physicalStore(result,'X',values.scalar(first));physicalStore(result,'Y',values.scalar(second));result.control.arithmetic={constant:null,percent:false};result.history.at(-1).expression=result.expression;return result;
      }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
    }
    return null;
  }
  // N-base has its own integer grammar: A-F are digits, not decimal variables.
  function physicalPhase9(previous,next,n){
    if(previous.layers.mode!=='NORMAL'||previous.workflow.kind==='menu')return null;
    const phase=previous.workflow.kind==='prompt'?previous.workflow.returnPhase:previous.lifecycle;
    const radix=previous.control.nbase.radix,conversion=previous.secondActive?({38:16,39:2,43:5,44:8,48:10})[n]:undefined;
    if(radix===10&&!conversion)return null;
    const stores=Object.fromEntries(Object.entries(physicalTypedVariables(previous)).map(([k,v])=>[k,BigInt(Math.trunc(values.toNumber(v)))]));
    stores.ANS=Number.isFinite(previous.answer)?BigInt(Math.trunc(previous.answer)):0n;stores.M=BigInt(Math.trunc(previous.memoryValue));
    const source=()=>phase==='evaluated'?nbase.encode(BigInt(Math.trunc(previous.lastValue)),radix):previous.expression+previous.entry||'0';
    const number=()=>phase==='evaluated'?BigInt(Math.trunc(previous.lastValue)):nbase.evaluate(source(),radix,stores);
    const publish=(value,base,display,updateAnswer=true)=>{
      next.control.nbase.radix=base;next.lastValue=Number(value);next.values.last=base===10?values.scalar(Number(value)):nbase.typed(value,base);
      if(updateAnswer){next.answer=next.lastValue;next.values.answer=values.copy(next.values.last);}
      next.expression=display.endsWith('=')?display.slice(0,-1):base===10?String(value):nbase.encode(value,base);next.entry='';next.stagedEntry=null;next.editor=semantic.createEditor([]);next.displayExpression=display;next.displayResult=next.resultDisplay=base===10?formatValue(Number(value)):nbase.encode(value,base);next.lifecycle='evaluated';next.workflow=emptyWorkflow();next.secondActive=false;next.layers.alpha=false;next.control.errorCode=null;next.selectionActive=false;next.layers.intent={kind:'nbase-value'};return next;
    };
    const editing=()=>{next.lifecycle='entering';next.displayExpression=next.expression;next.displayResult=next.resultDisplay=next.entry||'0';next.editor=semantic.createEditor([]);next.control.errorCode=null;next.layers.intent={kind:'nbase-entry'};return next;};
    try{
      if(conversion){
        let value,display;
        if(radix===10){const result=phase==='evaluated'?previous:physicalCalculate(next,physicalSource(previous)||'0');if(result.lifecycle==='error')return result;value=BigInt(Math.trunc(result.lastValue));display=formatValue(result.lastValue);if(display.startsWith('-'))display='('+display+')';}
        else {value=number();display=nbase.encode(value,radix);}
        if(conversion!==10)nbase.checked(value,conversion);
        return publish(value,conversion,display+'→'+nbase.names[conversion]);
      }
      if(previous.workflow.kind==='prompt'&&['STO','RCL'].includes(previous.workflow.payload.id)){
        const slot=({18:'A',19:'B',20:'C',21:'D',22:'E',23:'F',27:'X',28:'Y',29:'M'})[n];
        const formula=({8:0,9:1,10:2,11:3})[n];
        if(formula!==undefined){
          if(previous.workflow.payload.id==='STO'){
            const raw=previous.expression+previous.entry||'0',tokens=nbase.tokens(raw).map(value=>({kind:'+-*:/'.includes(value)?'operator':'()'.includes(value)?'punctuation':'nbase',value}));
            if(next.control.formulas.reduce((sum,t,i)=>sum+physicalFormulaLength(i===formula?tokens:t),0)>256)throw new RangeError('Formula capacity');
            next.control.formulas[formula]=tokens;next.workflow=emptyWorkflow();next.lifecycle='evaluated';next.displayExpression=raw+'→';next.displayResult=next.resultDisplay='F'+(formula+1);next.layers.intent={kind:'formula-store'};return next;
          }
          const stored=previous.control.formulas[formula],raw=stored.map(t=>t.kind==='symbol'&&/^[A-FXYM]$/.test(t.value)?'$'+t.value:t.value).join('');
          try{if(stored.some(t=>t.kind==='number'&&!/^\d+$/.test(t.value)))throw new SyntaxError('Unavailable literal');for(const token of nbase.tokens(raw))if(/^[0-9A-F]+$/.test(token))nbase.literal(token,radix);}catch{next=physicalError(next,5);next.layers.intent={kind:'nbase-error'};next.workflow=emptyWorkflow();return next;}
          next.workflow=emptyWorkflow();next.expression=raw;next.entry='';return editing();
        }
        if(!slot)return next;
        if(previous.workflow.payload.id==='STO'){const value=number(),display=source();publish(value,radix,display+'→'+slot);physicalStore(next,slot,next.values.last);return next;}
        const value=nbase.checked(stores[slot],radix);
        if(phase!=='evaluated'&&(previous.expression||previous.entry)){next.workflow=emptyWorkflow();next.expression+=next.entry+'$'+slot;next.entry='';return editing();}
        publish(value,radix,slot+'=',false);next.layers.intent={kind:'memory-value',operation:'RCL',slot};next.expression='$'+slot;return next;
      }
      if(n===3){next.secondActive=!previous.secondActive;return next;}
      if(n===5){next.layers.alpha=!previous.layers.alpha;next.secondActive=false;return next;}
      if(n===4||n===6)return null;
      if((n===27||n===28)&&!previous.secondActive&&!previous.layers.alpha){next.workflow={kind:'prompt',payload:{id:n===28?'STO':'RCL'},page:0,returnPhase:previous.lifecycle};next.lifecycle='prompt';return next;}
      if(n===29&&!previous.layers.alpha){const value=number(),sum=nbase.checked(stores.M+(previous.secondActive?-value:value),radix);publish(value,radix,source()+(previous.secondActive?'M−':'M+'));physicalStore(next,'M',nbase.typed(sum,radix));return next;}
      if(n===48&&!previous.secondActive&&!previous.layers.alpha){if(phase==='evaluated')return next;if(nbase.tokens(source()).reduce((sum,t)=>sum+(/^[0-9A-F]+$/.test(t)?t.length:1),0)+1>142){next=physicalError(next,4);next.layers.intent={kind:'nbase-error'};return next;}return publish(number(),radix,source()+'=');}
      if(n===7&&!previous.secondActive){if(next.entry)next.entry=next.entry.slice(0,-1);else{const cells=nbase.tokens(next.expression);cells.pop();next.expression=cells.join('');}return editing();}
      if(n===9||n===10){
        // Native BIN Error 5 discards the unavailable recalled formula and
        // restores an empty insertion cursor with the current base retained.
        if(previous.control.errorCode===5){next.expression='';next.entry='';next.stagedEntry=null;next.workflow=emptyWorkflow();next.selectionActive=true;next.cursor=0;return editing();}
        return next;
      }
      let digit=previous.secondActive||previous.layers.alpha?undefined:DIGIT_KEYS[n];
      if(!previous.secondActive&&!previous.layers.alpha&&radix===16&&n>=18&&n<=23)digit='ABCDEF'[n-18];
      if(digit!==undefined){if(parseInt(digit,16)>=radix)return next;if(phase==='evaluated'||previous.lifecycle==='error'){next.expression='';next.entry='';}if(next.entry.length>=10)return next;next.entry+=digit;next.secondActive=false;return editing();}
      const memorySlot=previous.layers.alpha?({18:'A',19:'B',20:'C',21:'D',22:'E',23:'F',27:'X',28:'Y',29:'M'})[n]:undefined;
      const op=!previous.secondActive&&!previous.layers.alpha?({12:'NOT',13:'AND',14:'OR',15:'XOR',16:'XNOR',47:'NEG',38:'*',39:':',43:'+',44:'-',33:'(',34:')'})[n]:undefined;
      const atom=memorySlot?'$'+memorySlot:previous.layers.alpha&&n===48?'ans':op;
      if(atom){if(previous.lifecycle==='error'){next.expression='';next.entry='';}if(phase==='evaluated'){next.expression=['NOT','NEG','(','ans'].includes(atom)||memorySlot?'':previous.layers.intent?.operation==='RCL'?'$'+previous.layers.intent.slot:'ans';next.entry='';}next.expression+=next.entry+atom;next.entry='';next.secondActive=false;next.layers.alpha=false;return editing();}
      next.secondActive=false;return next; // Scientific functions and fractional digits are unavailable.
    }catch(error){next=physicalError(next,error instanceof RangeError?2:1);next.layers.intent={kind:'nbase-error'};next.secondActive=false;next.workflow=emptyWorkflow();return next;}
  }
  const statisticalRows=s=>s.values.statistics.rows.map(r=>({x:values.toNumber(r.x),y:r.y===null?null:values.toNumber(r.y),weight:r.weight}));
  const listToTyped=a=>({kind:'list',elements:a.map(values.scalar)});
  const listFromTyped=v=>v.elements.map(values.toNumber);
  function physicalListEdit(next,data=[0]){
    next.values.last=listToTyped(data);next.control.buffers.list=values.copy(next.values.last);next.expression='';next.entry='';next.stagedEntry=null;
    next.workflow={kind:'data-entry',payload:{id:'LIST_BUFFER',keyLayer:true,label:'SIZE=',index:-1,input:'',list:[...data]},page:0,returnPhase:'empty'};next.lifecycle='data-entry';return next;
  }
  function physicalListSelect(previous,index){
    const id=previous.workflow.payload.id;let next=structuredClone(previous);
    if(id==='MATH'&&index<5){if(index<3){next=physicalMenu(previous,'LIST_SLOTS');next.workflow.payload.operation=index;return next;}return physicalMenu(previous,index===3?'LIST_OPE':'LIST_MATH');}
    if(id==='LIST_SLOTS'){
      const operation=previous.workflow.payload.operation;next.workflow=emptyWorkflow();
      if(operation===2){if(!previous.control.buffers.list)return physicalError(next,7);next.control.lists[index]=values.copy(previous.control.buffers.list);next.lifecycle='empty';return next;}
      if(operation===1){if(!previous.control.lists[index]){next.control.buffers.list=null;next.expression='';next.entry='';next.stagedEntry=null;next.lifecycle='empty';return next;}next=physicalListEdit(next,listFromTyped(previous.control.lists[index]));next.workflow=emptyWorkflow();next.lifecycle='empty';return next;}
      if(previous.workflow.returnPhase==='evaluated'){next.expression='';next.entry='';}
      next=physicalFlush(next,false);next.expression+='L'+(index+1);return physicalEditor(next);
    }
    if(id==='MATH'&&index>=5){
      const slots=previous.control.lists;if(!slots.some(Boolean))return physicalError(next,10);
      if(slots.some(v=>v&&v.elements.length>4))return physicalError(next,9);
      if(index===5)next.control.matrices=slots.map(v=>v?matrixToTyped({rows:v.elements.length,columns:1,data:v.elements.map(values.toNumber)}):null);
      else {const active=slots.filter(Boolean),n=active[0].elements.length;if(active.some(v=>v.elements.length!==n))return physicalError(next,8);next.control.matrices[0]=matrixToTyped({rows:n,columns:active.length,data:Array.from({length:n},(_,r)=>active.map(v=>values.toNumber(v.elements[r]))).flat()});}
      next.layers.mode='MAT';next.control.submode=null;next.workflow=emptyWorkflow();next.expression='';next.entry='';next.lifecycle='empty';return next;
    }
    const name=id==='LIST_OPE'?['lsortA','lsortD','ldim','lfill','lcumul','ldiff','laug'][index]:['lmin','lmax','lmean','lmed','lsum','lprod','lstd','lvar','louter','linner','labs'][index];
    next.workflow=emptyWorkflow();next=physicalFlush(next,false);if(previous.workflow.returnPhase==='evaluated')next.expression='';next.expression+=name+'(';next.lifecycle='entering';return physicalEditor(next);
  }
  function physicalPhase16(previous,next,intent,n){
    if(previous.layers.mode!=='LIST')return null;
    if(previous.secondActive&&n===48){next.secondActive=false;return next;}
    const p=previous.workflow.payload;
    if(previous.workflow.kind==='data-entry'&&p?.id==='LIST_BUFFER'){
      const q=next.workflow.payload;
      if([9,10].includes(n)){next.workflow=emptyWorkflow();next.expression='';next.entry='';next.stagedEntry=null;next.selectionActive=true;next.cursor=0;next.displayResult=next.resultDisplay='0';return physicalEditor(next);}
      if(n===3){next.secondActive=!previous.secondActive;return next;}if(n===4||n===6)return null;
      if(n===7){if(previous.secondActive){next.secondActive=false;return next;}q.input=p.input.slice(0,-1);return next;}if(n===47){q.input=/E-?\d*$/.test(p.input)?p.input.replace(/E(-?)(\d*)$/,(_,sign,digits)=>'E'+(sign?'':'-')+digits):p.input.startsWith('-')?p.input.slice(1):'-'+(p.input||'0');return next;}
      if(n===29||[8,11].includes(n)){
        try{const value=p.input?physicalNumeric(semantic.evaluate(semantic.parseTokens(semantic.tokenize(closeOpenParentheses(p.input.replace(/E(-?)$/,(_,sign)=>'E'+sign+'0')).replaceAll(':','/'),{physical:true}),{physical:true}),physicalAdapter,{angleMode:next.angleMode,answer:0})):p.index===-1?p.list.length:p.list[p.index];
          if(p.index<0){lists.size(value);if(value!==p.list.length)q.list=lists.fill(0,value);}else q.list[p.index]=lists.list([value])[0];
          q.index=Math.max(-1,Math.min(q.list.length-1,p.index+(n===8?-1:1)));q.input='';q.label=q.index===-1?'SIZE=':'LIST'+(q.index+1)+'=';next.values.last=listToTyped(q.list);next.control.buffers.list=values.copy(next.values.last);next.control.errorCode=null;return next;
        }catch(error){next.workflow=emptyWorkflow();return physicalError(next,error.code||2);}
      }
      if(DIGIT_KEYS[n]!==undefined)q.input+=DIGIT_KEYS[n];else if(n===46)q.input+=(p.input?'':'0')+'.';else if(n===24&&!p.input.includes('E'))q.input=(p.input||'1')+'E';else if({33:'(',34:')',38:'*',39:':',43:'+',44:'-'}[n])q.input+=({33:'(',34:')',38:'*',39:':',43:'+',44:'-'})[n];return next;
    }
    if(previous.workflow.kind)return null;
    if([8,11].includes(n))return physicalListEdit(next,previous.control.buffers.list?listFromTyped(previous.control.buffers.list):undefined);
    if(n===48&&!previous.secondActive){try{const source=physicalSource(previous)||'0',ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});const result=lists.evaluate(ast,semantic,physicalAdapter,{angleMode:previous.angleMode,answer:previous.answer,lists:previous.control.lists.map(v=>v?listFromTyped(v):null),binary:physicalCollectionBinary});if(Array.isArray(result))return physicalListEdit(next,result);return physicalCalculate(next,String(result),source);}catch(error){return physicalError(next,error.code||(error instanceof RangeError?2:1));}}
    if(previous.secondActive&&n===28){next=physicalFlush(next,false);next.expression+=',';next.secondActive=false;return physicalEditor(next);}
    if([20,21].includes(n)&&!previous.secondActive){next=physicalFlush(next);next.expression+=n===20?'^2':'^3';return physicalEditor(next);}
    if(n===18&&previous.secondActive){next=physicalFlush(next);next.expression+='^(-1)';next.secondActive=false;return physicalEditor(next);}
    if(!previous.secondActive&&[38,39,43,44,33,34].includes(n)){next=physicalFlush(next);next.expression+=({38:'*',39:':',43:'+',44:'-',33:'(',34:')'})[n];return physicalEditor(next);}return null;
  }
  const matrixFromTyped=v=>({rows:v.rows,columns:v.columns,data:v.elements.map(values.toNumber)});
  const matrixToTyped=m=>({kind:'matrix',rows:m.rows,columns:m.columns,elements:m.data.map(values.scalar)});
  function physicalMatrixEdit(next,matrix) {
    const m=matrix||{rows:1,columns:1,data:[0]};
    next.values.last=matrixToTyped(m);next.control.buffers.matrix=values.copy(next.values.last);next.expression='';next.entry='';next.stagedEntry=null;
    next.workflow={kind:'data-entry',payload:{id:'MAT_BUFFER',keyLayer:true,label:'ROW=',index:-2,input:'',matrix:m},page:0,returnPhase:'empty'};next.lifecycle='data-entry';return next;
  }
  function physicalMatrixSelect(previous,index) {
    const id=previous.workflow.payload.id;let next=structuredClone(previous);
    if(id==='MATH'&&index<5){
      if(index<3){next=physicalMenu(previous,'MAT_SLOTS');next.workflow.payload.operation=index;return next;}
      return physicalMenu(previous,index===3?'MAT_OPE':'MAT_MATH');
    }
    if(id==='MAT_SLOTS'){
      const operation=previous.workflow.payload.operation;next.workflow=emptyWorkflow();
      if(operation===2){if(!previous.control.buffers.matrix)return physicalError(next,7);next.control.matrices[index]=values.copy(previous.control.buffers.matrix);next.lifecycle='empty';return next;}
      if(operation===1){if(!previous.control.matrices[index]){next.control.buffers.matrix=null;next.expression='';next.entry='';next.stagedEntry=null;next.lifecycle='empty';return next;}next=physicalMatrixEdit(next,matrixFromTyped(previous.control.matrices[index]));next.workflow=emptyWorkflow();next.lifecycle='empty';return next;}
      if(previous.workflow.returnPhase==='evaluated'){next.expression='';next.entry='';}
      next=physicalFlush(next,false);next.expression+='mat'+String.fromCharCode(65+index);return physicalEditor(next);
    }
    if(id==='MATH'&&index>=5){
      const list=a=>({kind:'list',elements:a.map(values.scalar)}),slots=previous.control.matrices;
      if(index===6){if(!slots[0])return physicalError(next,7);const m=matrixFromTyped(slots[0]);next.control.lists=Array.from({length:4},(_,col)=>col<m.columns?list(Array.from({length:m.rows},(_,row)=>m.data[row*m.columns+col])):null);}
      else next.control.lists=slots.map(v=>v?list(Array.from({length:v.rows},(_,row)=>values.toNumber(v.elements[row*v.columns]))):null);
      next.layers.mode='LIST';next.control.submode=null;next.workflow=emptyWorkflow();next.expression='';next.entry='';next.lifecycle='empty';return next;
    }
    const name=id==='MAT_OPE'?['dim','fill','cumul','aug','identity','rndmat'][index]:['det','trans'][index];
    next.workflow=emptyWorkflow();next=physicalFlush(next);if(previous.workflow.returnPhase==='evaluated')next.expression='';next.expression+=name+'(';next.lifecycle='entering';return physicalEditor(next);
  }
  function physicalPhase15(previous,next,intent,n,randomSample) {
    if(previous.layers.mode!=='MAT')return null;
    if(previous.secondActive&&n===48){next.secondActive=false;return next;}
    const p=previous.workflow.payload;
    if(previous.workflow.kind==='data-entry'&&p?.id==='MAT_BUFFER'){
      const q=next.workflow.payload;
      if(n===3){next.secondActive=!previous.secondActive;return next;}
      if(n===4||n===6)return null;
      if(n===7){q.input=p.input.slice(0,-1);return next;}
      if(n===47){q.input=/E-?\d*$/.test(p.input)?p.input.replace(/E(-?)(\d*)$/,(_,sign,digits)=>'E'+(sign?'':'-')+digits):p.input.startsWith('-')?p.input.slice(1):'-'+(p.input||'0');return next;}
      if(n===29||[8,11].includes(n)){
        try{
          const value=p.input?physicalNumeric(semantic.evaluate(semantic.parseTokens(semantic.tokenize(closeOpenParentheses(p.input.replace(/E(-?)$/,(_,sign)=>'E'+sign+'0')).replaceAll(':','/'),{physical:true}),{physical:true}),physicalAdapter,{angleMode:next.angleMode,answer:0})):p.index===-2?p.matrix.rows:p.index===-1?p.matrix.columns:p.matrix.data[p.index];
          if(p.index<0){if(!Number.isInteger(value)||value<1||value>4){const e=new RangeError('Matrix dimension');e.code=7;throw e;}const rows=p.index===-2?value:p.matrix.rows,columns=p.index===-1?value:p.matrix.columns;q.matrix=rows===p.matrix.rows&&columns===p.matrix.columns?q.matrix:matrices.fill(0,rows,columns);}
          else q.matrix.data[p.index]=value;
          q.index=Math.max(-2,Math.min(q.matrix.data.length-1,p.index+(n===8?-1:1)));q.input='';q.label=q.index===-2?'ROW=':q.index===-1?'COLUMN=':'MAT'+(Math.floor(q.index/q.matrix.columns)+1)+','+(q.index%q.matrix.columns+1)+'=';
          next.values.last=matrixToTyped(q.matrix);next.control.buffers.matrix=values.copy(next.values.last);next.control.errorCode=null;return next;
        }catch(error){next.layers.intent={kind:'matrix-error',workflow:structuredClone(next.workflow)};next.workflow=emptyWorkflow();return physicalError(next,error.code||2);}
      }
      if(DIGIT_KEYS[n]!==undefined)q.input+=DIGIT_KEYS[n];else if(n===46)q.input+=(p.input?'':'0')+'.';else if(n===24&&!p.input.includes('E'))q.input=(p.input||'1')+'E';else if({33:'(',34:')',38:'*',39:':',43:'+',44:'-'}[n])q.input+=({33:'(',34:')',38:'*',39:':',43:'+',44:'-'})[n];
      return next;
    }
    if(previous.workflow.kind)return null;
    if([8,11].includes(n))return physicalMatrixEdit(next,previous.control.buffers.matrix?matrixFromTyped(previous.control.buffers.matrix):undefined);
    if(n===48&&previous.layers.alpha){next=physicalFlush(next,false);next.expression+='ans';next.layers.alpha=false;return physicalEditor(next);}
    if(n===48&&!previous.secondActive){
      try{
        const source=physicalSource(previous)||'0',ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
        const result=matrices.evaluate(ast,semantic,physicalAdapter,{angleMode:previous.angleMode,answer:previous.answer,matrices:previous.control.matrices.map(v=>v?matrixFromTyped(v):null),sum:(a,b)=>physicalCollectionBinary('+',a,b),binary:physicalCollectionBinary,random:()=>randomSample===undefined?Math.random():randomSample});
        if(typeof result==='object')return physicalMatrixEdit(next,result);
        next=physicalCalculate(next,String(result),source);return next;
      }catch(error){return physicalError(next,error.code|| (error instanceof RangeError?2:1));}
    }
    if(previous.secondActive&&n===28){next=physicalFlush(next,false);next.expression+=',';next.secondActive=false;return physicalEditor(next);}
    if([20,21].includes(n)&&!previous.secondActive){next=physicalFlush(next);next.expression+=n===20?'^2':'^3';return physicalEditor(next);}
    if(n===18&&previous.secondActive){next=physicalFlush(next);next.expression+='^(-1)';next.secondActive=false;return physicalEditor(next);}
    if(!previous.secondActive&&[38,39,43,44,33,34].includes(n)){next=physicalFlush(next);next.expression+=({38:'*',39:':',43:'+',44:'-',33:'(',34:')'})[n];return physicalEditor(next);}
    return null;
  }
  function physicalCollectionBinary(op,a,b){
    if(op==='+'||op==='-')return physicalNumeric(Number(engine.quantize(engine.decimalBinary(op,String(a),String(b)),13,'truncate')));
    if(op==='*')return physicalNumeric(Number(engine.quantize(String(a*b),14,'truncate')));
    if(op==='/')return physicalNumeric(a/b);
    return physicalAdapter.binary(op,a,b);
  }
  function physicalComplexBinary(op,a,b){
    // Independent CPLX probes constrain different intermediate budgets: sums
    // lose the fourteenth significant digit, while scaled products retain it.
    // Keep native binary division behavior, including ANS(1/3)*3-1 = zero.
    const quantize=(text,digits)=>physicalNumeric(Number(engine.quantize(text,digits,'truncate')));
    if(op==='+'||op==='-')return complex.z(
      quantize(engine.decimalBinary(op,String(a.real),String(b.real)),13),
      quantize(engine.decimalBinary(op,String(a.imaginary),String(b.imaginary)),13));
    if(op==='*'){const result=complex.multiply(a,b);return complex.z(quantize(String(result.real),14),quantize(String(result.imaginary),14));}
    return op==='/'?complex.divide(a,b):complex.power(a,b);
  }
  function physicalComplexResult(previous,source) {
    let next=structuredClone(previous);
    try{
      const numeric=v=>v.kind==='complex'?complex.z(values.toNumber(v.real),values.toNumber(v.imaginary)):complex.z(values.toNumber(v));
      const ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
      const result=complex.evaluate(ast,semantic,physicalAdapter,{angleMode:previous.angleMode,answer:numeric(previous.values.answer),memory:numeric(previous.values.memory),binary:physicalComplexBinary});
      const typed=result.imaginary?{kind:'complex',real:values.scalar(result.real),imaginary:values.scalar(result.imaginary)}:values.scalar(result.real);
      next=commitTypedResult(next,typed);next.expression=source+'=';next.entry='';next.stagedEntry=null;next.editor=editorForState(next);next.lifecycle='evaluated';next.displayExpression=source+'=';next.resultMode='decimal';next.control.errorCode=null;
      next.layers.intent={kind:'complex-result',polar:previous.layers.intent?.polar===true,component:result.real===0&&result.imaginary!==0?1:0};return next;
    }catch(error){next.workflow=emptyWorkflow();return physicalError(next,error instanceof RangeError?2:1);}
  }
  function physicalPhase14(previous,next,intent,n) {
    if(previous.layers.mode!=='CPLX'||previous.workflow.kind)return null;
    if(n===3){next.secondActive=!previous.secondActive;return next;}
    if(n===48&&!previous.secondActive)return physicalComplexResult(previous,physicalSource(previous)||'0');
    if(previous.secondActive&&[31,32,24].includes(n)){
      next.secondActive=false;
      if(n===31||n===32){next.layers.intent={kind:'complex-result',polar:n===31,component:0};return next;}
      if(previous.lifecycle==='evaluated'){next.layers.intent={kind:'complex-result',polar:previous.layers.intent?.polar===true,component:previous.layers.intent?.component===1?0:1};return next;}
      return next;
    }
    if(n===25&&!previous.secondActive){try{next=physicalFlush(next);}catch{return physicalError(next,1);}if(previous.lifecycle==='evaluated')next.expression='';next.expression+='i';next.secondActive=false;return physicalEditor(next);}
    if(!previous.secondActive&&n===26){try{next=physicalFlush(next);}catch{return physicalError(next,1);}next.expression='polar('+next.expression+',';next.secondActive=false;return physicalEditor(next);}
    if(n===19&&!previous.secondActive){next=physicalFlush(next);if(previous.lifecycle==='evaluated')next.expression='ans';next.expression='cpow('+next.expression+',';return physicalEditor(next);}
    if(n===18&&!previous.secondActive&&!previous.layers.alpha){next=physicalFlush(next);if(previous.lifecycle==='evaluated')next.expression='';next.expression+='pi';return physicalEditor(next);}
    if([12,13,14,15,16,18,20,21,22,23,26].includes(n)&&!previous.layers.alpha){
      if([20,21].includes(n)&&!previous.secondActive){next=physicalFlush(next);if(previous.lifecycle==='evaluated')next.expression='ans';next.expression+=n===20?'^2':'^3';return physicalEditor(next);}
      if(n===18&&previous.secondActive){next=physicalFlush(next);if(previous.lifecycle==='evaluated')next.expression='ans';next.expression+='^(-1)';next.secondActive=false;return physicalEditor(next);}
      return next;
    }
    if(!previous.layers.alpha&&!previous.secondActive&&[38,39,43,44,33,34].includes(n)){
      try{next=physicalFlush(next);}catch{return physicalError(next,1);}if(previous.lifecycle==='evaluated')next.expression='ans';next.expression+=({38:'*',39:':',43:'+',44:'-',33:'(',34:')'})[n];return physicalEditor(next);
    }
    return null;
  }
  function physicalEquationStart(next, coefficients) {
    const mode=next.control.submode,size=mode==='2-VLE'?2:mode==='3-VLE'?3:0;
    const labels=size?Array.from({length:size*(size+1)},(_,i)=>String.fromCharCode(97+i%(size+1))+(Math.floor(i/(size+1))+1)+'?'):Array.from({length:mode==='QUAD'?3:4},(_,i)=>String.fromCharCode(97+i)+'?');
    next.workflow={kind:'data-entry',payload:{id:'EQN_COEFFICIENTS',keyLayer:true,labels,label:labels[0],coefficient:0,coefficients:coefficients||labels.map(()=>0),input:'',size},page:0,returnPhase:'empty'};
    next.entry='';next.expression='';next.stagedEntry=null;next.lifecycle='data-entry';return next;
  }
  function physicalPhase13(previous,next,n) {
    if(previous.layers.mode!=='EQN')return null;
    const p=previous.workflow.payload;
    if(previous.workflow.kind==='multi-result'&&p?.id==='EQN_RESULTS'){
      if(n===4||n===6)return null;
      if(n===3){next.secondActive=!previous.secondActive;return next;}
      if(n===48||[8,11].includes(n)){
        const direction=previous.secondActive||n===8?-1:1,page=previous.workflow.page+direction;
        next.secondActive=false;
        if(page>=p.pages.length)return physicalEquationStart(next,p.coefficients);
        next.workflow.page=Math.max(0,page);return next;
      }
      if(previous.secondActive&&n===24){const page=next.workflow.payload.pages[next.workflow.page];if(page.alternate){[page.value,page.alternate]=[page.alternate,page.value];page.component=page.component==='i'?'xy':'i';}next.secondActive=false;return next;}
      next.secondActive=false;return next;
    }
    if(previous.workflow.kind!=='data-entry'||p?.id!=='EQN_COEFFICIENTS')return null;
    if(n===3){next.secondActive=!previous.secondActive;return next;}
    if(n===4||n===6||n===1||n===2)return null;
    const q=next.workflow.payload;
    if(n===7){q.input=p.input.slice(0,-1);return next;}
    if(n===47){q.input=p.input.startsWith('-')?p.input.slice(1):'-'+(p.input||p.coefficients[p.coefficient]);return next;}
    if(n===48||[8,11].includes(n)){
      try{
        if(p.input)q.coefficients[p.coefficient]=physicalNumeric(semantic.evaluate(semantic.parseTokens(semantic.tokenize(closeOpenParentheses(p.input).replaceAll(':','/'),{physical:true}),{physical:true}),physicalAdapter,{angleMode:next.angleMode,answer:0}));
        const direction=previous.secondActive||n===8?-1:1,index=p.coefficient+direction;
        next.secondActive=false;
        if(index<p.labels.length){q.coefficient=Math.max(0,index);q.label=q.labels[q.coefficient];q.input='';return next;}
        const solved=p.size?equations.linear(q.coefficients,p.size):{solutions:next.control.submode==='QUAD'?equations.quadratic(q.coefficients):equations.cubic(q.coefficients)};
        const pages=solved.solutions.map((r,i)=>({label:p.size?['x=','y=','z='][i]:'X'+(i+1)+'=',value:values.scalar(r.real),...(r.imaginary?{alternate:values.scalar(r.imaginary),component:'xy'}:{})}));
        if(p.size)pages.push({label:'det=',value:values.scalar(solved.determinant)});
        next.values.last={kind:'equation',components:solved.solutions.map((r,i)=>({label:pages[i].label,value:r.imaginary?{kind:'complex',real:values.scalar(r.real),imaginary:values.scalar(r.imaginary)}:values.scalar(r.real)}))};
        next.workflow={kind:'multi-result',payload:{id:'EQN_RESULTS',pages,coefficients:q.coefficients},page:0,returnPhase:'data-entry'};next.lifecycle='multi-result';next.control.errorCode=null;return next;
      }catch(error){next.layers.intent={kind:'equation-error',workflow:structuredClone(next.workflow)};next.workflow=emptyWorkflow();return physicalError(next,error instanceof RangeError?2:1);}
    }
    if(DIGIT_KEYS[n]!==undefined)q.input+=DIGIT_KEYS[n];
    else if(n===46)q.input+=(p.input?'':'0')+'.';
    else if(n===24)q.input=(p.input||'1')+'E';
    else if({33:'(',34:')',38:'*',39:':',43:'+',44:'-'}[n])q.input+=({33:'(',34:')',38:'*',39:':',43:'+',44:'-'})[n];
    return next;
  }
  function physicalStatisticsResult(state,name){return statistics.result(statisticalRows(state),state.control.submode,name,state.control.submode==='SD'?{xSum:items=>items.reduce((total,item)=>physicalCollectionBinary('+',total,item),0)}:undefined);}
  function physicalStatisticsAdapter(state){return {...physicalAdapter,
    symbol:(name,scope)=>{const key=Object.keys(STAT_SYMBOLS).find(k=>STAT_SYMBOLS[k]===name);return key?physicalNumeric(physicalStatisticsResult(state,ALPHA_STATS[key])):physicalAdapter.symbol(name,scope);},
    call:(name,args,scope)=>name==='statt'?physicalNumeric((args[0]-physicalStatisticsResult(state,'mean-x'))/physicalStatisticsResult(state,'population-deviation-x')):/^prob[pqr]$/.test(name)?statistics.probability(name.slice(-1).toUpperCase(),args[0]):physicalAdapter.call(name,args,scope)};}
  function physicalStatisticsMath(previous,index){
    let next=structuredClone(previous);next.workflow=emptyWorkflow();next.lifecycle=previous.workflow.returnPhase;
    try{if(index>0){
      if(next.lifecycle==='evaluated'||previous.layers.intent?.kind==='statistics-display'){next.expression='';next.entry='';next.stagedEntry=null;}
      next=physicalFlush(next);next.expression+=['','probp(','probq(','probr('][index];return physicalEditor(next);
    }
    const source=physicalSource(next)||'0';next.expression='statt('+closeOpenParentheses(source)+')';next.entry='';next.stagedEntry=null;next.displayResult=next.resultDisplay='0';return physicalEditor(next);
    }catch(e){next=physicalError(next,2);next.layers.intent={kind:'statistics-error'};return next;}
  }
  function physicalPhase12(previous,next,intent,n){
    if(previous.layers.mode!=='STAT')return null;
    const w=previous.workflow;
    if(!w.kind&&previous.secondActive&&[33,34].includes(n)){
      try{const source=physicalSource(previous)||'0',operand=previous.lifecycle==='evaluated'?previous:physicalCalculate(previous,source);if(operand.lifecycle==='error'){operand.layers.intent={kind:'statistics-error'};return operand;}const input=operand.lastValue;
        const number=statistics.estimate(statisticalRows(previous),previous.control.submode,n===33?'x':'y',input);
        const result=physicalCalculate(next,String(number));result.expression=source.replace(/=$/,'');result.editor=editorForState(result);result.displayExpression=source+(n===33?'x\u0302':'y\u0302');result.layers.intent={kind:'statistics-estimate',direction:n===33?'x':'y',input,second:false};return result;
      }catch{next=physicalError(next,2);next.layers.intent={kind:'statistics-error'};next.secondActive=false;return next;}
    }
    if(n===5&&previous.secondActive&&!w.kind){next.secondActive=false;next.layers.alpha=true;return next;}
    if(STAT_SYMBOLS[n]&&(previous.layers.alpha||w.payload?.id==='RCL')){
      const symbol=STAT_SYMBOLS[n],name=ALPHA_STATS[n];next.secondActive=false;next.layers.alpha=false;
      if(w.payload?.id==='RCL'){
        next.workflow=emptyWorkflow();next.lifecycle=w.returnPhase;
        try{const number=physicalStatisticsResult(previous,name);const result=physicalCalculate(next,String(number));result.displayExpression=STAT_LABELS[symbol]+'=';result.layers.intent={kind:'statistics-result'};return result;}
        catch{next=physicalError(next,2);next.layers.intent={kind:'statistics-error'};return next;}
      }
      if(!w.kind){if(previous.lifecycle==='evaluated'||previous.layers.intent?.kind==='statistics-display'){next.expression='';next.entry='';next.stagedEntry=null;}
        next=physicalFlush(next,false);next.expression+=symbol;return physicalEditor(next);}
    }
    if(!w.kind&&previous.secondActive&&n===24&&previous.control.submode==='QUAD'&&previous.layers.intent?.kind==='statistics-estimate'&&previous.layers.intent.direction==='x'){
      try{const p=previous.layers.intent;const number=statistics.estimate(statisticalRows(previous),'QUAD','x',p.input,!p.second);const result=physicalCalculate(next,String(number),previous.displayExpression.replace(/=$/,''));result.layers.intent={...p,second:!p.second};return result;}catch{next=physicalError(next,2);next.layers.intent={kind:'statistics-error'};return next;}
    }
    if(!w.kind&&n===48&&!previous.secondActive){const result=physicalCalculate(next,physicalSource(previous)||'0');result.control.statistics.editing=true;if(result.lifecycle==='error')result.layers.intent={kind:'statistics-error'};return result;}
    return null;
  }
  // Statistics stores typed observations; entry uses the same numeric editor as
  // NORMAL, while DATA, comma and browsing own their distinct state transitions.
  function physicalStatisticsDisplay(next,browse=false){
    const p=next.control.statistics,rows=next.values.statistics.rows,width=next.control.submode==='SD'?2:3;
    next.expression='';next.entry='';next.stagedEntry=null;next.selectionActive=false;next.workflow=emptyWorkflow();next.lifecycle='empty';next.control.errorCode=null;next.secondActive=false;next.layers.alpha=false;
    if(browse&&p.cursor!==null){
      const index=Math.floor(p.cursor/width),field=p.cursor%width,row=rows[index];
      next.displayExpression=(field===0?'X':width===3&&field===1?'Y':'N')+(index+1)+'=';
      next.displayResult=next.resultDisplay=String(field===0?values.toNumber(row.x):width===3&&field===1?values.toNumber(row.y):row.weight);
    }else {next.displayExpression='DATA SET=';next.displayResult=next.resultDisplay=String(rows.length);p.cursor=null;}
    p.parts=[];p.editing=false;next.layers.intent={kind:'statistics-display'};next.editor=editorForState(next);return next;
  }
  function physicalPhase11(previous,next,intent,n,randomSample){
    if(previous.layers.mode!=='STAT'||previous.workflow.kind!==null)return null;
    const p=next.control.statistics,rows=next.values.statistics.rows,width=previous.control.submode==='SD'?2:3;
    const index=p.cursor===null?null:Math.floor(p.cursor/width),field=p.cursor===null?null:p.cursor%width;
    const error=code=>{const failed=physicalError(next,code);failed.layers.intent={kind:'statistics-error'};failed.secondActive=false;return failed;};
    if(n===16||previous.secondActive&&n===17){next.secondActive=false;return next;}
    if(n===3){next.secondActive=!previous.secondActive;next.layers.alpha=false;return next;}
    if(n===5&&!previous.secondActive){next.layers.alpha=!previous.layers.alpha;next.secondActive=false;return next;}
    if(n===8||n===11){
      if(!rows.length)return next;
      p.cursor=p.cursor===null?(n===11?0:rows.length*width-1):Math.max(0,Math.min(rows.length*width-1,p.cursor+(n===11?1:-1)));
      return physicalStatisticsDisplay(next,true);
    }
    if(previous.secondActive&&n===29){
      if(index!==null){rows.splice(index,1);p.frequencies.splice(index,1);next.statsValues.splice(index,1);}
      return physicalStatisticsDisplay(next);
    }
    if((n===29&&!previous.layers.alpha&&!previous.secondActive)||(n===28&&previous.secondActive)){
      if(previous.lifecycle==='error')return next;
      try{
        let source=physicalSource(previous);
        if(p.cursor!==null&&!p.editing&&!p.parts.length)source=String(field===0?values.toNumber(rows[index].x):width===3&&field===1?values.toNumber(rows[index].y):rows[index].weight);
        const calculated=physicalCalculate(previous,source||'0');
        if(calculated.lifecycle==='error')return error(calculated.control.errorCode);
        if(n===28){
          if(p.parts.length>=width-1)return error(1);
          p.parts.push(source||'0');p.editing=true;next.expression='';next.entry='';next.stagedEntry=null;next.displayExpression='';next.displayResult=next.resultDisplay='0';next.lifecycle='entering';next.secondActive=false;next.layers.intent={kind:'statistics-entry'};next.editor=editorForState(next);return next;
        }
        const numbers=[...p.parts,source||'0'].map(part=>{const r=physicalCalculate(previous,part);if(r.lifecycle==='error'){const e=new Error('Invalid statistical operand');e.code=r.control.errorCode;throw e;}return r.lastValue;});
        let row,explicit;
        if(index!==null&&!p.parts.length){
          row=structuredClone(rows[index]);explicit=p.frequencies[index];
          if(field===0)row.x=values.scalar(numbers[0]);else if(width===3&&field===1)row.y=values.scalar(numbers[0]);else {row.weight=numbers[0];explicit=true;}
        }else{
          if(width===3&&numbers.length<2)return error(1);
          row={x:values.scalar(numbers[0]),y:width===3?values.scalar(numbers[1]):null,weight:numbers.length===width?numbers.at(-1):1};explicit=numbers.length===width;
        }
        const cost=(r,e)=>1+(r.y===null?0:1)+(e?1:0);
        const used=rows.reduce((total,r,i)=>total+cost(r,p.frequencies[i]),0)-(index===null?0:cost(rows[index],p.frequencies[index]));
        if(row.weight!==0&&used+cost(row,explicit)>100)return error(3);
        if(index!==null){
          if(row.weight===0){rows.splice(index,1);p.frequencies.splice(index,1);next.statsValues.splice(index,1);return physicalStatisticsDisplay(next);}
          rows[index]=row;p.frequencies[index]=explicit;next.statsValues[index]=values.toNumber(row.x);return physicalStatisticsDisplay(next,true);
        }
        if(row.weight!==0){rows.push(row);p.frequencies.push(explicit);next.statsValues.push(values.toNumber(row.x));}
        return physicalStatisticsDisplay(next);
      }catch(e){return error(e.code|| (e instanceof RangeError?2:1));}
    }
    // Memory/result selector workflows remain owned by their own controllers.
    if([27,28].includes(n)||intent.kind==='statistic'||previous.layers.alpha&&n!==48)return null;
    if(previous.lifecycle==='error')return next;
    const normal=structuredClone(previous);normal.layers.mode='NORMAL';normal.control.arithmetic=initialControl().arithmetic;
    if(p.cursor!==null&&!p.editing||previous.layers.intent?.kind==='statistics-display'){
      normal.expression='';normal.entry='';normal.stagedEntry=null;normal.displayExpression='';normal.displayResult='0';normal.lifecycle='empty';normal.layers.intent=null;
    }
    const entered=reducePhysicalKey(normal,physicalId(n),randomSample);
    entered.layers.mode='STAT';entered.control.submode=previous.control.submode;entered.control.statistics=structuredClone(p);entered.values.statistics=values.copy(previous.values.statistics);entered.statsValues=[...previous.statsValues];
    if(intent.kind==='operation'||n===48)entered.control.statistics.editing=true;
    if(entered.lifecycle==='error')entered.layers.intent={kind:'statistics-error'};
    return entered;
  }
  function reducePhysicalKey(previous,id,randomSample){
    if(randomSample!==undefined&&(!Number.isFinite(randomSample)||randomSample<0||randomSample>=1))throw new TypeError("Invalid random sample");
    const intent=resolvePhysicalKey(previous,id); // Reject malformed identities even while asleep.
    const n=Number(id.slice(-2));let next=structuredClone(previous);next.control.idleMs=0;
    if(intent.kind==='operation')next.layers.intent=structuredClone(intent);
    if(previous.control.power==='off')return n===2?physicalClear(previous):previous;
    if(n===2 && previous.secondActive)return physicalPowerOff(previous);
    if(n===2)return physicalClear(previous);
    if(n===1){next=physicalClear(previous,previous.layers.mode==='NORMAL'?'command':'mode');next.layers.mode='NORMAL';next.control.submode=null;next.control.nbase={radix:10};return next;}
    if(previous.secondActive&&n===4)return physicalClear(previous,'internal');
    if(previous.secondActive&&n===47)return physicalMenu(previous,'MEMORY_CLEAR');
    if(previous.secondActive&&n===45){
      next.secondActive=false;
      if(previous.lifecycle==='evaluated'&&!previous.stagedEntry&&['scalar','rational'].includes(previous.values.last.kind)&&!(['NORM1','NORM2'].includes(previous.layers.settings.format)&&['mixed','improper'].includes(previous.resultMode))){
        const modified=formatting.sharpNumber(values.toNumber(previous.values.last),previous.layers.settings).roundedValue;
        if(!Number.isFinite(modified))return physicalError(next,2);
        next.answer=next.lastValue=modified;next.values.answer=next.values.last=values.scalar(modified);next.lastExactDisplay='';next.resultMode='decimal';next.resultDisplay=next.displayResult=formatValue(modified);
      }
      return next;
    }
    if(['MAT','CPLX','LIST'].includes(previous.layers.mode)&&previous.secondActive&&n===17){next.secondActive=false;return next;}
    if(previous.layers.mode==='MAT'&&previous.lifecycle==='error'&&[7,8,9].includes(previous.control.errorCode)&&[9,10].includes(n)){
      const source=previous.layers.intent?.kind==='matrix-error'?previous.layers.intent.workflow.payload.input:physicalSource(previous).replace(/=$/,'');
      next.workflow=emptyWorkflow();next.expression=source;next.entry='';next.stagedEntry=null;next.selectionActive=Boolean(source);next.cursor=source.length;next.displayResult=next.resultDisplay='0';next.layers.intent=null;return physicalEditor(next);
    }
    // Apply the manual's independent expression and pending-value budgets before
    // numerical controllers return. Matrix/list definition inputs have one saved
    // value slot; other non-NORMAL modes have five, NORMAL has ten.
    const bufferInput=previous.workflow.kind==='data-entry'&&['MAT_BUFFER','LIST_BUFFER'].includes(previous.workflow.payload?.id)&&[8,11,29].includes(n);
    const equationInput=previous.workflow.kind==='data-entry'&&previous.layers.mode==='EQN'&&[8,11,48].includes(n);
    const ordinaryInput=previous.workflow.kind===null&&n===48&&!previous.secondActive&&!previous.layers.alpha;
    const statisticsInput=previous.layers.mode==='STAT'&&previous.workflow.kind===null&&n===29&&!previous.secondActive&&!previous.layers.alpha;
    if(bufferInput||equationInput||ordinaryInput||statisticsInput){
      let source;
      try{source=bufferInput||equationInput?previous.workflow.payload.input:physicalSource(previous).replace(/=$/,'');}
      catch(error){if(!(error instanceof SyntaxError))throw error;} // Controller owns incomplete staged-input diagnostics.
      if(source!==undefined){
        const usage=physicalBufferUsage(source||''),limit=bufferInput?1:previous.layers.mode==='NORMAL'?10:5;
        const code=physicalLength(source||'')+1>142?4:usage.calculations>24||usage.numeric>limit?3:null;
        if(code){
          const failed=physicalError(next,code);
          if(bufferInput||equationInput){
            failed.layers.intent={kind:equationInput?'equation-error':previous.layers.mode==='MAT'?'matrix-error':'list-capacity-error',workflow:structuredClone(previous.workflow)};
            failed.workflow=emptyWorkflow();
            if(bufferInput){failed.expression=source;failed.entry='';failed.stagedEntry=null;}
          }else if(previous.control.nbase.radix!==10)failed.layers.intent={kind:'nbase-error'};
          else if(previous.layers.mode==='STAT')failed.layers.intent={kind:'statistics-error'};
          return failed;
        }
      }
    }
    if(previous.layers.mode!=='NORMAL'&&previous.lifecycle==='error'&&previous.control.errorCode===3&&previous.workflow.kind===null&&[9,10].includes(n)){
      const source=physicalSource(previous).replace(/=$/,'');next.expression=source;next.entry='';next.stagedEntry=null;next.selectionActive=Boolean(source);next.cursor=physicalBufferUsage(source,5).faultIndex??0;next.displayResult=next.resultDisplay='';next.layers.intent=null;return physicalEditor(next);
    }
    const baseKey=physicalPhase9(previous,next,n);if(baseKey)return baseKey;
    const calculusKey=physicalPhase10(previous,next,n);if(calculusKey)return calculusKey;
    if(previous.secondActive&&[30,41,42].includes(n)||['CNST','CONV'].includes(previous.workflow.payload?.id)||n===48&&previous.layers.mode!=='NORMAL'&&/(?:random|dice|coin|rint|cv)\(/.test(previous.expression)){const earlyCatalogue=physicalPhase7(previous,next,intent,n,randomSample);if(earlyCatalogue)return earlyCatalogue;}
    const listKey=physicalPhase16(previous,next,intent,n);if(listKey)return listKey;
    const matrixKey=physicalPhase15(previous,next,intent,n,randomSample);if(matrixKey)return matrixKey;
    const complexKey=physicalPhase14(previous,next,intent,n);if(complexKey)return complexKey;
    const equationKey=physicalPhase13(previous,next,n);if(equationKey)return equationKey;
    const promptKey=physicalPhase8Prompt(previous,next,n);if(promptKey)return promptKey;
    if(n===4)return physicalMenu(previous,'MODE');
    if(n===6)return physicalMenu(previous,'SETUP');
    if(n===17&&!previous.secondActive)return physicalMenu(previous,'MATH');
    if(previous.workflow.kind==='prompt'&&previous.workflow.payload.id==='TAB'){
      if(DIGIT_KEYS[n]!==undefined){next.layers.settings.tab=Number(DIGIT_KEYS[n]);next.lifecycle=previous.workflow.returnPhase;next.workflow=structuredClone(previous.workflow.payload.resumeWorkflow||emptyWorkflow());}
      return next;
    }
    if(previous.workflow.kind==='menu'&&['MODE','STAT','EQN','CLEAR','MEMORY_CLEAR','SETUP','ANGLE','FORMAT','MATH','ENG','RANDOM','MAT_SLOTS','MAT_OPE','MAT_MATH','LIST_SLOTS','LIST_OPE','LIST_MATH'].includes(previous.workflow.payload.id)){
      const w=next.workflow,groups=w.payload.groups;let selected=w.payload.selected;
      if(n===9||n===10){selected=Math.max(0,Math.min(w.payload.choices.length-1,selected+(n===9?-1:1)));}
      else if(n===8||n===11){w.page=['FORMAT','ENG'].includes(w.payload.id)?(w.page+1)%groups.length:Math.max(0,Math.min(groups.length-1,w.page+(n===8?-1:1)));selected=groups.slice(0,w.page).reduce((a,b)=>a+b,0);}
      else if(n===18&&w.payload.choices.length>10)return physicalSelect(next,10)||next;
      else if(n===48||DIGIT_KEYS[n]!==undefined)return physicalSelect(next,n===48?selected:Number(DIGIT_KEYS[n]))||next;
      w.payload.selected=selected;
      if(n===9||n===10){let total=0;w.page=groups.findIndex(size=>(total+=size)>selected);}
      return next;
    }
    if(previous.workflow.payload?.id?.startsWith('CONFIRM_')){
      if(n===45||n===48)return previous.workflow.payload.id==='CONFIRM_RESET'?createInitialState():physicalClear(previous,'memory');
      return next;
    }
    const statisticalResult=physicalPhase12(previous,next,intent,n);if(statisticalResult)return statisticalResult;
    const statisticsKey=physicalPhase11(previous,next,intent,n,randomSample);if(statisticsKey)return statisticsKey;
    const memoryKey=physicalPhase8(previous,next,intent,n,randomSample);if(memoryKey)return memoryKey;
    const catalogueKey=physicalPhase7(previous,next,intent,n,randomSample);if(catalogueKey)return catalogueKey;
    const scalarKey=physicalPhase6(previous,next,intent,n);if(scalarKey)return scalarKey;
    if(previous.layers.mode==='NORMAL'&&previous.workflow.kind===null&&!previous.layers.alpha&&!previous.layers.hyp){
      const shifted=previous.secondActive;
      if(n===48&&!shifted){
        if(previous.lifecycle==='evaluated'&&!previous.control.arithmetic.percent&&!['r=','x='].includes(previous.displayExpression)&&!/(?:random|dice|coin|rint)\(\)/.test(previous.expression))return next;
        try{
          let source=physicalSource(previous),display=source;
          const buffers=physicalBufferUsage(source);
          if(physicalLength(source)+1>142)return physicalError(next,4);
          if(buffers.calculations>24||buffers.numeric>10)return physicalError(next,3);
          const constant=previous.control.arithmetic.constant;
          if(previous.entry&&!previous.expression&&constant){source=constant.operator==='*'?`${constant.operand}*${source}`:`${source}${constant.operator}${constant.operand}`;display=constant.operator==='*'?`K*${previous.entry}`:`${previous.entry}${constant.operator}K`;}
          const result=physicalCalculate(next,source,display,false,randomSample);
          if(result.lifecycle==='evaluated'&&!constant){
            const ast=result.editor.ast;
            if(ast.kind==='binary'&&!ast.implied&&['+','-','*','/'].includes(ast.operator)){
              const operand=semantic.evaluate(ast.operator==='*'?ast.left:ast.right,physicalAdapter,{angleMode:previous.angleMode,answer:previous.answer,variables:physicalVariables(previous)});
              const operandAst=ast.operator==='*'?ast.left:ast.right;
              const retained=values.evaluateAst(operandAst,semantic,physicalAdapter,{angleMode:previous.angleMode,answer:previous.values.answer.kind==='nbase'?values.scalar(previous.answer):previous.values.answer,physical:true,variables:physicalTypedVariables(previous)});
              const literal=retained.kind==='rational'?`frac(0,${retained.numerator},${retained.denominator})`:String(operand).replace('e','E');
              result.control.arithmetic.constant={operator:ast.operator==='/'?':':ast.operator,operand:literal.startsWith('-')?`(${literal})`:literal};
            }
          }
          return result;
        }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
      }
      if(shifted&&n===40){
        try{
          const source=physicalSource(previous),ast=semantic.parseTokens(semantic.tokenize(closeOpenParentheses(source).replaceAll(':','/'),{physical:true}),{physical:true});
          if(ast.kind!=='binary'||!['+','-','*','/'].includes(ast.operator))return physicalError(next,1);
          const a=semantic.evaluate(ast.left,physicalAdapter,{angleMode:previous.angleMode,answer:previous.answer}),b=semantic.evaluate(ast.right,physicalAdapter,{angleMode:previous.angleMode,answer:previous.answer});
          const number=physicalNumeric(ast.operator==='+'?a+a*b/100:ast.operator==='-'?a-a*b/100:ast.operator==='*'?a*b/100:a/b*100);
          const result=physicalCalculate(next,String(number),source+'%',true);
          result.expression=source+'=';result.displayExpression=source+'%';result.editor=editorForState(result);result.control.arithmetic.constant=null;
          if(result.lifecycle==='evaluated')result.history.at(-1).expression=result.expression;
          return result;
        }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
      }
      if(intent.kind==='operation'&&!previous.selectionActive){
        const insert=intent.event.insert,action=intent.event.action;
        if(insert==='.'&&!previous.stagedEntry&&(!previous.entry||previous.entry==='-'))next.entry=previous.entry==='-'?'-0':'0';
        if(previous.stagedEntry?.type==='exp'&&insert==='.')return next;
        if(previous.stagedEntry?.type==='exp'&&/^\d$/.test(insert||'')){
          const stage=next.stagedEntry,negative=stage.exponent.startsWith('-'),digits=stage.exponent.replace(/\D/g,'');
          if(stage.hasExponent&&digits.length>=2){stage.exponent=(negative?'-':'')+(digits+insert).slice(-2);next.secondActive=false;next.resultDisplay=next.displayResult=`${stage.base}*10^${stage.exponent}`;return physicalEditor(next);}
        }
        if(action==='exp'&&!previous.entry&&!previous.stagedEntry&&previous.lifecycle!=='evaluated')next.entry='1';
        if(['+','-', '*','/','^2','^3','^(-1)','!'].includes(insert)){
          try{
            const postfix=['^2','^3','^(-1)','!'].includes(insert);
            if(postfix&&previous.stagedEntry?.type==='power'){
              const stage=next.stagedEntry;if(!stage.hasExponent)return physicalError(next,1);
              stage.exponent=insert==='!'?`fact(${stage.exponent})`:stage.exponent+insert;next.secondActive=false;return physicalEditor(next);
            }
            if(previous.lifecycle==='evaluated'){next.expression='ans';next.entry='';next.stagedEntry=null;next.control.arithmetic={constant:null,percent:false};}
            next=physicalFlush(next,!postfix);
            const op=insert==='/'?':':insert;
            if(insert==='!'){
              const source=next.expression,operand=physicalLastOperand(source);
              if(!operand)return physicalError(next,1);next.expression=source.slice(0,-operand.length)+`fact(${operand})`;
            }else next.expression+=op;
            next.secondActive=false;return physicalEditor(next);
          }catch(error){return physicalError(next,error instanceof RangeError?2:1);}
        }
        if(insert===')'){try{next=physicalFlush(next,false);}catch{return physicalError(next,1);}next.expression+=')';next.secondActive=false;return physicalEditor(next);}
        if(insert==='('){try{next=physicalFlush(next);}catch{return physicalError(next,1);}next.expression+='(';next.secondActive=false;return physicalEditor(next);}
        if(['sin(','cos(','tan(','asin(','acos(','atan(','sqrt(','cbrt(','log(','ln(','10^(','e^('].includes(insert)){
          try{next=physicalFunctionFlush(next);}catch{return physicalError(next,1);}
          if(previous.lifecycle==='evaluated'){next.expression='';next.control.arithmetic={constant:null,percent:false};}
          next.expression+=({'10^(':'tenpow(','e^(':'epow('})[insert]||insert;next.secondActive=false;return physicalEditor(next);
        }
        if(['power','root','npr','ncr'].includes(action)&&['physicalFraction','dms'].includes(previous.stagedEntry?.type)){try{next=physicalFlush(next);}catch{return physicalError(next,1);}const operand=physicalLastOperand(next.expression);next.entry=operand;next.expression=next.expression.slice(0,-operand.length);return reducePhysicalKey(next,id);}
        if(action==='power'&&previous.stagedEntry){try{next=physicalFlush(next);}catch{return physicalError(next,1);}next.expression+='^';next.secondActive=false;return physicalEditor(next);}
        if(action==='power'&&!previous.entry&&!previous.stagedEntry&&previous.lifecycle!=='evaluated'){
          const operand=physicalLastOperand(next.expression);
          if(operand){next.entry=operand;next.expression=next.expression.slice(0,-operand.length);}
        }
        if(['power','root','npr','ncr'].includes(action)&&previous.lifecycle==='evaluated'){next.expression='';next.entry='ans';next.stagedEntry=null;next.control.arithmetic={constant:null,percent:false};}
        if(action==='sign'&&previous.lifecycle==='evaluated'){next.expression='';next.entry='';next.stagedEntry=null;next.control.arithmetic={constant:null,percent:false};}
        if(previous.lifecycle==='evaluated'&&/^\d$/.test(insert||'')){next.expression='';next.entry='';next.stagedEntry=null;next.control.arithmetic.percent=false;}
        if(['pi','ans'].includes(insert)){
          try{next=physicalFlush(next);}catch{return physicalError(next,1);}
          if(previous.lifecycle==='evaluated')next.expression='';next.expression+=insert;next.secondActive=false;return physicalEditor(next);
        }
      }
    }
    // Structured editor addresses complete functions and individual number digits.
    if([9,10].includes(n)&&previous.stagedEntry&&previous.workflow.kind===null){
      const stage=previous.stagedEntry;
      if(stage.type==='exp'){next.entry='';next.stagedEntry=null;next.selectionActive=Boolean(next.expression);next.cursor=n===9?physicalCells(next.expression).at(-1)?.start||0:0;next.displayResult=next.resultDisplay=next.expression?'':'0';return physicalEditor(next);}
      const prefix=stage.type==='fraction'?`${stage.numerator||'0'}/`:stage.type==='power'?`${stage.base}^`:stage.type==='exp'?`${stage.base}e`:stage.type==='root'?`root(${stage.index},`:stage.type==='dms'?`dms(${stage.degrees},${stage.part==='seconds'?`${stage.minutes},`:''}`:'';
      if(prefix){next.expression=previous.expression+prefix;next.entry='';next.stagedEntry=null;next.selectionActive=true;next.cursor=n===9?physicalCells(next.expression).at(-1).start:0;next.displayResult=next.resultDisplay='';return physicalEditor(next);}
    }
    if(n===7&&!previous.secondActive&&previous.stagedEntry){
      const stage=next.stagedEntry,part=stage.part||(stage.type==='root'?'radicand':'exponent');
      if(typeof stage[part]==='string'){
        stage[part]=stage[part].slice(0,-1);
        const flag={exponent:'hasExponent',radicand:'hasRadicand',minutes:'hasMinutes',seconds:'hasSeconds'}[part];if(flag)stage[flag]=Boolean(stage[part]);
        next.displayResult=next.resultDisplay=stage[part]||'0';return physicalEditor(next);
      }
    }
    if([9,10].includes(n)&&!previous.stagedEntry&&previous.workflow.kind===null){
      const bufferFault=previous.layers.mode==='NORMAL'&&previous.control.errorCode===3;
      const lengthFault=previous.layers.mode==='NORMAL'&&previous.control.errorCode===4;
      const endFault=previous.layers.mode==='NORMAL'&&[2,6].includes(previous.control.errorCode);
      const syntaxFault=previous.layers.mode==='NORMAL'&&previous.control.errorCode===1;
      const undefinedMatrixFault=previous.layers.mode==='MAT'&&previous.control.errorCode===10;
      const matrixAugSyntaxFault=previous.layers.mode==='MAT'&&previous.control.errorCode===1&&previous.expression.startsWith('aug(');
      const source=(bufferFault||lengthFault||endFault||syntaxFault||matrixAugSyntaxFault?physicalSource(previous):previous.expression).replace(/=$/,'');const cells=physicalCells(source);
    const evaluated=previous.expression.endsWith('=');next.expression=source;next.entry='';next.stagedEntry=null;
      if(bufferFault)next.cursor=physicalBufferUsage(source).faultIndex??0;
      else if(lengthFault)next.cursor=cells.at(-1)?.start||0;
      else if(endFault||matrixAugSyntaxFault)next.cursor=source.length;
      else if(undefinedMatrixFault)next.cursor=0;
      else if(syntaxFault)next.cursor=Math.min(previous.cursor,source.length);
      else if(!previous.selectionActive)next.cursor=n===9?(evaluated?source.length:cells.at(-1)?.start||0):0;
      else if(n===9)next.cursor=cells.filter(c=>c.start<previous.cursor).at(-1)?.start||0;
      else next.cursor=cells.find(c=>c.start>=previous.cursor)?.end??source.length;
      next.selectionActive=Boolean(source)||(previous.layers.mode==='LIST'&&previous.selectionActive);next.displayResult=next.resultDisplay=next.cursor<source.length?'':'0';next.historyIndex=null;
      return physicalEditor(next);
    }
    if(n===7&&!previous.secondActive&&previous.selectionActive&&!previous.stagedEntry){
      const cells=physicalCells(previous.expression);const cell=cells.find(c=>c.start===previous.cursor)||cells.at(-1);
      if(cell){next.expression=previous.expression.slice(0,cell.start)+previous.expression.slice(cell.end);next.cursor=Math.min(cell.start,next.expression.length);}
      next.displayResult=next.resultDisplay=next.cursor<next.expression.length?'':'0';return physicalEditor(next);
    }
    if([8,11].includes(n)&&previous.workflow.kind===null&&!previous.stagedEntry&&previous.layers.mode==='NORMAL'){
      next.secondActive=false;next.layers.alpha=false;next.layers.hyp=false;
      if(!previous.history.length)return next;
      const last=previous.history.length-1;
      next.historyIndex=previous.secondActive&&n===8?0:previous.historyIndex===null?last:Math.max(0,Math.min(last,previous.historyIndex+(n===8?-1:1)));
      const h=previous.history[next.historyIndex];next.expression=h.expression.replace(/=$/,'');next.entry='';next.selectionActive=true;
      next.cursor=previous.historyIndex===null?0:Math.min(previous.cursor,next.expression.length);next.displayResult=next.resultDisplay='';return physicalEditor(next);
    }
    if(previous.selectionActive&&!previous.stagedEntry&&intent.kind==='operation'&&intent.event.insert){
      const text=intent.event.insert.replaceAll('/',DIVIDE_TOKEN);const cells=physicalCells(previous.expression);const cell=cells.find(c=>c.start===previous.cursor);
      next.expression=previous.expression.slice(0,previous.cursor)+text+previous.expression.slice(previous.cursor+(previous.layers.settings.insert===false&&cell?cell.text.length:0));
      next.cursor+=text.length;next.selectionActive=true;next.secondActive=false;next.layers.alpha=false;next.layers.hyp=false;
      next.displayResult=next.resultDisplay=next.cursor<next.expression.length?'':'0';next.historyIndex=null;
      if(physicalLength(next.expression)>142)return previous;return physicalEditor(next);
    }
    // Other numerical modes gain entry now; their algorithms retain their own phases.
    if(previous.layers.mode!=='NORMAL' && intent.kind==='operation' && !['clear','home'].includes(intent.event.action)){
      if(intent.event.action==='equals')throw new TypeError('Numeric mode implementation pending');
      const normal=structuredClone(next);normal.workflow=emptyWorkflow();normal.lifecycle=inferEntryPhase(normal);normal.layers.mode='NORMAL';
      const entered=reduceFoundationPhysicalKey(normal,id);entered.layers.mode=previous.layers.mode;entered.control.submode=previous.control.submode;
      if(previous.workflow.kind==='data-entry'){entered.workflow=structuredClone(previous.workflow);entered.lifecycle='data-entry';}return entered;
    }
    if(intent.kind==='operation'&&/^\d$/.test(intent.event.insert||'')&&!previous.selectionActive){
      const staged=previous.stagedEntry;
      const text=staged?staged[staged.part||(staged.type==='root'?'radicand':'exponent')]:previous.entry;
      const limit=staged?.type==='exp'?2:10;
      if(typeof text==='string'&&text.replace(/\D/g,'').length>=limit)return next;
    }
    const evaluated=previous.expression.endsWith('=');
    if(evaluated&&intent.kind==='operation'&&intent.event.insert&&['+','-', '*','/','^2','^3'].includes(intent.event.insert)){
      next.expression='ans';next.entry='';next.displayExpression='ans';next.selectionActive=false;next.lifecycle='entering';
    }
    next=reduceFoundationPhysicalKey(next,id);
    if(next.expression.endsWith('=')&&n===48&&next.layers.mode==='NORMAL'){
      next.history=[...previous.history,structuredClone(next.history.at(-1))];
      next.values.history=[...previous.values.history,values.copy(next.values.answer)];
      // History uses the device's shared character budget, with whole functions counting once.
      while(next.history.length>1&&next.history.reduce((total,h)=>total+physicalLength(h.expression),0)>142){next.history.shift();next.values.history.shift();}
    }
    const source=next.expression.replace(/=$/,'')+next.entry;
    const computing=n===48 && intent.kind==='operation' && intent.event.action==='equals';
    if(computing && physicalLength(previous.expression.replace(/=$/,'')+previous.entry)+1>142)return physicalError(previous,4);
    if(physicalLength(source)>142){const full=structuredClone(previous);full.cursor=physicalCells(previous.expression).at(-1)?.start||0;full.selectionActive=true;return physicalEditor(full);}
    const buffers=physicalBufferUsage(previous.expression.replace(/=$/,'')+previous.entry);
    if(computing && (buffers.calculations>24||buffers.numeric>(next.layers.mode==='NORMAL'?10:5)))return physicalError(structuredClone(previous),3);
    if(next.lifecycle==='error'&&!next.control.errorCode)next.control.errorCode=1;
    return next;
  }

  function reduceFoundationPhysicalKey(previous, id) {
    if (previous.workflow.kind === "multi-result" && ["EL506-K08", "EL506-K09", "EL506-K10", "EL506-K11"].includes(id)) {
      return reduceCalculator(previous, {type:"workflow", command:"page", direction:["EL506-K08", "EL506-K09"].includes(id) ? -1 : 1});
    }
    if (previous.workflow.kind === "menu" && ["EL506-K08", "EL506-K11"].includes(id)) {
      const next = structuredClone(previous);
      const maximum = Math.max(0, Math.ceil((next.workflow.payload.choices?.length || 0) / 2) - 1);
      next.workflow.page = Math.max(0, Math.min(maximum, next.workflow.page + (id === "EL506-K08" ? -1 : 1)));
      validateState(next);
      return next;
    }
    const intent = resolvePhysicalKey(previous, id);
    let next = structuredClone(previous);
    const dismiss = () => { if (next.workflow.kind) next = reduceCalculator(next,{type:"workflow",command:"dismiss"}); };
    const open = name => {
      dismiss(); next.secondActive = false; next.layers.alpha = false; next.layers.hyp = false; next.layers.inverseHyp = false;
      const prompts = ["STO","RCL","SOLV","ALGB","STATVAR","CNST","CONV","MEMORY_CLEAR"];
      next = reduceCalculator(next,{type:"workflow",command:prompts.includes(name)?"open-prompt":"open-menu",payload:{id:name,keyLayer:true,choices:KEY_MENUS[name] || (["STO","RCL"].includes(name)?Object.values(MEMORY_KEYS):[]),path:[]}});
    };
    if (intent.kind === "modifier") {
      if (intent.name === "second") { next.secondActive = !next.secondActive; next.layers.alpha = false; next.layers.inverseHyp=next.secondActive&&next.layers.hyp; }
      if (intent.name === "alpha") { next.layers.alpha = !next.layers.alpha; next.secondActive = false; }
      if (intent.name === "hyp") { next.layers.hyp = !next.layers.hyp; next.layers.inverseHyp = next.secondActive && next.layers.hyp; }
      if (intent.name === "insert") { next.layers.settings.insert = next.layers.settings.insert === false; next.secondActive = false; }
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
        if (["EL506-K09", "EL506-K10"].includes(id) && previous.displayExpression && !previous.expression.endsWith("=") && !previous.stagedEntry) {
          const direction = id === "EL506-K09" ? -1 : 1;
          next.cursor = previous.selectionActive ? Math.max(0, Math.min(next.expression.length, previous.cursor + direction)) : direction < 0 ? next.expression.length - 1 : 0;
          next.selectionActive = true;
          next.lifecycle = "editing";
          next.editor = editorForState(next);
        }
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
        expression = `${expression.slice(0, cursor)}${value}${expression.slice(cursor + (previous.layers?.settings.insert === false ? 1 : 0))}`;
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
    catalogues, memoryPolicy, commitTypedResult, evaluateTypedAst, evaluateExpression, evaluateExactExpression, formatValue,
    closeOpenParentheses,
  });
});
