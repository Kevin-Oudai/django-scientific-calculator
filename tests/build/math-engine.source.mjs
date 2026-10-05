import { add, subtract, multiply, divide, pow } from 'mathjs/number';
import { create, bignumberDependencies } from 'mathjs';

export const version = '15.2.0';
const numberOperations = Object.freeze({'+': add, '-': subtract, '*': multiply, '/': divide, '^': pow});
const decimalOperations = Object.freeze({'+': 'plus', '-': 'minus', '*': 'times', '/': 'div', '^': 'pow'});
const roundingModes = Object.freeze({'half-up': 4, 'half-even': 6, 'truncate': 1});
function decimalText(value) {
  if (typeof value !== 'string' || value.length > 1100 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(value)) throw new TypeError('Expected bounded decimal text');
  return value;
}
export function createEngine({precision = 64} = {}) {
  if (!Number.isInteger(precision) || precision < 10 || precision > 100) throw new RangeError('Precision must be 10..100');
  const math = create({bignumberDependencies}, {precision});
  return Object.freeze({
    binary(op, a, b) {
      if (!Object.hasOwn(numberOperations, op) || typeof a !== 'number' || typeof b !== 'number') throw new TypeError('Unsupported numeric operation');
      return numberOperations[op](a, b);
    },
    decimalBinary(op, a, b) {
      if (!Object.hasOwn(decimalOperations, op)) throw new TypeError('Unsupported decimal operation');
      const left = math.bignumber(decimalText(a)), right = math.bignumber(decimalText(b));
      if (op === '^' && (!right.isInteger() || right.abs().gt(1000))) throw new RangeError('Decimal exponent must be an integer within 1000');
      return left[decimalOperations[op]](right).toString();
    },
    quantize(value, digits, rounding = 'half-up') {
      if (!Number.isInteger(digits) || digits < 1 || digits > precision || !Object.hasOwn(roundingModes, rounding)) throw new RangeError('Unsupported quantization');
      return math.bignumber(decimalText(value)).toSignificantDigits(digits, roundingModes[rounding]).toString();
    },
    decimalPlaces(value, places, rounding = 'half-up') {
      if (!Number.isInteger(places) || places < 0 || places > 99 || !Object.hasOwn(roundingModes, rounding)) throw new RangeError('Unsupported decimal places');
      return math.bignumber(decimalText(value)).toFixed(places, roundingModes[rounding]);
    },
  });
}
