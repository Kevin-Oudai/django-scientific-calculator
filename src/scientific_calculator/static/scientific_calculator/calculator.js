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
    let lastExactDisplay = "";
    let resultMode = "decimal";
    let angleMode = "DEG";
    let history = [];
    let historyIndex = null;
    let historyDraft = "";
    let secondActive = false;
    let memoryValue = 0;
    const statsValues = [];

    const expressionForDisplay = () => {
      if (!expression) {
        return "";
      }
      if (!selectionActive || cursor >= expression.length) {
        return expression;
      }
      return `${expression.slice(0, cursor)}${SELECT_START}${expression[cursor]}${SELECT_END}${expression.slice(cursor + 1)}`;
    };

    const stagedFractionHtml = () => {
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

    const render = () => {
      expressionEl.innerHTML = formatExpression(expressionForDisplay());
      angleLabel.textContent = angleMode;
      resultEl.innerHTML = stagedEntry?.type === "fraction"
        ? stagedFractionHtml()
        : formatExpression(resultDisplay || "0");
      root.classList.toggle("is-second-active", secondActive);
      requestAnimationFrame(() => {
        expressionEl.scrollLeft = expressionEl.scrollWidth;
        resultEl.scrollLeft = resultEl.scrollWidth;
      });
    };

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
        resultEl.textContent = "Error";
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
        resultEl.textContent = "Error";
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
          resultEl.textContent = "Error";
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
          resultEl.textContent = "Error";
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

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !root.contains(button)) {
        return;
      }

      const useSecondFunction = secondActive && (button.dataset.secondInsert || button.dataset.secondAction);
      const insert = useSecondFunction ? button.dataset.secondInsert : button.dataset.insert;
      const action = useSecondFunction ? button.dataset.secondAction : button.dataset.action;

      if (useSecondFunction) {
        secondActive = false;
      }
      if (insert) {
        insertToken(insert);
      }
      if (action) {
        runAction(action);
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
