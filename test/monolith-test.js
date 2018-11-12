/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const common = require('../lib/script/common');
const Opcode = require('../lib/script/opcode');
const Script = require('../lib/script/script');
const Stack = require('../lib/script/stack');
const ScriptNum = require('../lib/script/scriptnum');

const EMPTY = Buffer.alloc(0);

const flags = [
  common.flags.VERIFY_NONE,
  common.flags.STANDARD_VERIFY_FLAGS,
  common.flags.MANDATORY_VERIFY_FLAGS
];

function isSuccess(stack, script, expected) {
  for (const flag of flags) {
    const input = stack.clone();
    script.execute(input, flag);
    // TODO: switch to assert.deepEqual
    assert.strictEqual(input.toString(), expected.toString());
  }
}

function isError(stack, script, error) {
  for (const flag of flags) {
    const input = stack.clone();
    let err;
    try {
      script.execute(input, flag);
    } catch (e) {
      err = e;
    }
    assert.typeOf(err, 'error');
    assert.strictEqual(err.code, error);
  }
}

function testBitwiseOp(a, b, op, expected) {
  const stack = new Stack();
  stack.push(a);
  stack.push(b);
  const script = Script.fromString(op);
  isSuccess(stack, script, expected);
}

function testBitwiseOps(a, b, and, or, xor) {
  testBitwiseOp(a, b, 'OP_AND', and);
  testBitwiseOp(b, a, 'OP_AND', and);

  testBitwiseOp(a, b, 'OP_OR', or);
  testBitwiseOp(b, a, 'OP_OR', or);

  testBitwiseOp(a, b, 'OP_XOR', xor);
  testBitwiseOp(b, a, 'OP_XOR', xor);
}

function testBitwiseOpError(stack, op, error) {
  const script = Script.fromString(op);
  isError(stack, script, error);
}

function testBitwiseOpErrors(stack, error) {
  testBitwiseOpError(stack, 'OP_AND', error);
  testBitwiseOpError(stack, 'OP_OR', error);
  testBitwiseOpError(stack, 'OP_XOR', error);
}

function testStringOp(a, b, expected) {
  testBitwiseOp(a, b, 'OP_CAT', expected);
  testBitwiseOp(a, EMPTY, 'OP_CAT', new Stack([a]));
  testBitwiseOp(b, EMPTY, 'OP_CAT', new Stack([b]));
  testBitwiseOp(EMPTY, a, 'OP_CAT', new Stack([a]));
  testBitwiseOp(EMPTY, b, 'OP_CAT', new Stack([b]));
}

function testDivModOp(a, b, div, mod) {
  testBitwiseOp(a, b, 'OP_DIV', div);
  testBitwiseOp(a, b, 'OP_MOD', mod);
}

function testTypeConversionOp(bin, num) {
  const stack = new Stack();
  stack.push(bin);
  const script = Script.fromString('OP_BIN2NUM');
  isSuccess(stack, script, num);
}

function testMinimalNegative(data, expected) {
  if (data.length > 0)
    data[data.length - 1] ^= 0x80;
  const minimal = ScriptNum.toMinimal(data);
  assert.bufferEqual(minimal, expected);
}

describe('Monolith', function() {
  it('should match monolith when flag enabled', async () => {
    const stack = new Stack();
    const a = Buffer.from('ab', 'hex');
    const b = Buffer.from('cd', 'hex');
    stack.push(a);
    stack.push(b);

    const script = Script.fromString('OP_CAT');
    const expected = new Stack([Buffer.from('abcd', 'hex')]);
    script.execute(stack);
    assert.strictEqual(stack.toString(), expected.toString());
  });

  it('should match minimal encoding', async () => {
    const minimalTestCases = [
      // [input, output]
      // Test zero values
      ['', ''],
      ['00', ''],
      ['80', ''],
      ['0000', ''],
      ['0080', ''],
      // Non-zero values
      ['01', '81'],
      ['81', '01'],
      ['0201', '0281'],
      ['0281', '0201'],
      ['ff0201', 'ff0281'],
      ['ff0281', 'ff0201'],
      ['ffff0201', 'ffff0281'],
      ['ffff0281', 'ffff0201'],
      // Should not be overly-minimized
      ['ff80', 'ff00'],
      ['ff00', 'ff80']
    ];

    for (const test of minimalTestCases) {
      const data = Buffer.from(test[0], 'hex');
      const expected = Buffer.from(test[1], 'hex');
      testMinimalNegative(data, expected);
    }
  });

  it('should match bitwise ops', async () => {
    const zeros = Buffer.alloc(520);
    const ones = Buffer.alloc(520, 255);
    const bitwiseTestCases = [
      // [name, a, b, and, or, xor]
      ['null x null', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      // Run all variations of zeros and ones.
      ['zeros x zeros', zeros, zeros, zeros, zeros, zeros],
      ['zeros x ones', zeros, ones, zeros, ones, ones],
      ['ones x ones', ones, ones, ones, ones, zeros]
    ];

    for (const test of bitwiseTestCases) {
      const and = new Stack([test[3]]);
      const or = new Stack([test[4]]);
      const xor = new Stack([test[5]]);
      testBitwiseOps(test[1], test[2], and, or, xor);
    }
  });

  it('should fail bitwise for less than 2 stack items', async () => {
    let stack = new Stack();

    // 1. Less than 2 elements on stack.
    testBitwiseOpErrors(stack, 'INVALID_STACK_OPERATION');

    stack = new Stack([EMPTY]);
    testBitwiseOpErrors(stack, 'INVALID_STACK_OPERATION');

    stack = new Stack([Opcode.fromData(Buffer.from('00', 'hex'))]);
    testBitwiseOpErrors(stack, 'INVALID_STACK_OPERATION');

    stack = new Stack([Opcode.fromData(Buffer.from('abcdef', 'hex'))]);
    testBitwiseOpErrors(stack, 'INVALID_STACK_OPERATION');
  });

  it('should fail bitwise for stack items of mismatching length', async () => {
    let stack = new Stack();
    // 2. Operand of mismatching length
    stack = new Stack([EMPTY, Opcode.fromData(Buffer.from('00', 'hex'))]);
    testBitwiseOpErrors(stack, 'INVALID_OPERAND_SIZE');

    stack = new Stack([Opcode.fromData(Buffer.from('00', 'hex')), EMPTY]);
    testBitwiseOpErrors(stack, 'INVALID_OPERAND_SIZE');

    stack = new Stack([
      Buffer.from('00', 'hex'),
      Buffer.from('abcdef', 'hex')
    ]);
    testBitwiseOpErrors(stack, 'INVALID_OPERAND_SIZE');

    stack = new Stack([
      Buffer.from('abcdef', 'hex'),
      Buffer.from('00', 'hex')
    ]);
    testBitwiseOpErrors(stack, 'INVALID_OPERAND_SIZE');
  });

  it('should match string ops', async () => {
    const stringTestCases = [
      // [a, b, expected]
      // Check for empty string.
      ['', '', ''],
      // Check for simple concats.
      ['00', '00', '0000'],
      ['ab', 'cd', 'abcd'],
      ['abcdef', '12345678', 'abcdef12345678']
    ];

    for (const test of stringTestCases) {
      const a = Buffer.from(test[0], 'hex');
      const b = Buffer.from(test[1], 'hex');
      const stack = new Stack([test[2]]);
      testStringOp(a, b, stack);
    }
  });

  for (const op of ['OP_CAT', 'OP_SPLIT']) {
    it(`should fail ${op} for less than 2 stack items`, async () => {
      let stack = new Stack();
      isError(stack, Script.fromString(op), 'INVALID_STACK_OPERATION');

      stack = new Stack([Buffer.from('', 'hex')]);
      isError(stack, Script.fromString(op), 'INVALID_STACK_OPERATION');

      stack = new Stack([Buffer.from('abcdef', 'hex')]);
      isError(stack, Script.fromString(op), 'INVALID_STACK_OPERATION');
    });
  }

  it('should match type conversion ops', async () => {
    const typeConversionTestCase = [
      // [bin, num]
      // Some known values.
      ['abcdef00', 'abcdef00'],
      ['abcd7f00', 'abcd7f'],
      // Reductions
      ['abcdef4280', 'abcdefc2'],
      ['abcd7f4200', 'abcd7f42']
    ];

    for (const test of typeConversionTestCase) {
      const bin = Buffer.from(test[0], 'hex');
      const num = new Stack([Buffer.from(test[1], 'hex')]);
      testTypeConversionOp(bin, num);
    }
  });

  it('should fail type conversion for empty stack', async () => {
    const stack = new Stack();

    // Empty stack is an error.
    for (const op of ['OP_NUM2BIN', 'OP_BIN2NUM']) {
      isError(stack, Script.fromString(op), 'INVALID_STACK_OPERATION');
    }
  });

  it('should fail NUM2BIN for less than 2 stack items', async () => {
    // NUM2BIN require 2 elements on the stack.
    const stack = new Stack([Buffer.from('00', 'hex')]);
    isError(stack, Script.fromString('OP_NUM2BIN'), 'INVALID_STACK_OPERATION');
  });

  it('should fail BIN2NUM for out of range', async () => {
    // Values that do not fit in 4 bytes are considered out of range for
    // BIN2NUM.
    let stack = new Stack([Buffer.from('abcdefc280', 'hex')]);
    isError(stack, Script.fromString('OP_BIN2NUM'), 'INVALID_NUMBER_RANGE');

    stack = new Stack([Buffer.from('0000008080', 'hex')]);
    isError(stack, Script.fromString('OP_BIN2NUM'), 'INVALID_NUMBER_RANGE');
  });

  it('should fail NUM2BIN for oversized push', async () => {
    // NUM2BIN must not generate oversized push.
    let stack = new Stack([Buffer.alloc(520), Buffer.from('0902', 'hex')]);
    isError(stack, Script.fromString('OP_NUM2BIN'), 'PUSH_SIZE');

    stack = new Stack([EMPTY, Buffer.from('0902', 'hex')]);
    isError(stack, Script.fromString('OP_NUM2BIN'), 'PUSH_SIZE');
  });

  it('should fail NUM2BIN for impossible encoding', async () => {
    // Check that the requested encoding is possible.
    const stack = new Stack([
      Buffer.from('abcdef80', 'hex'), Buffer.from('03', 'hex')]);
    isError(stack, Script.fromString('OP_NUM2BIN'), 'IMPOSSIBLE_ENCODING');
  });

  it('should match arithmetic ops', async () => {
    const arithmeticTestCases = [
      // [a, b, div, mod]
      // 0x185377af / 0x85f41b01 = -4
      // 0x185377af % 0x85f41b01 = 0x00830bab
      // 408123311 / -99883777 = -4
      // 408123311 % -99883777 = 8588203
      ['af775318', '011bf485', '84', 'ab0b8300'],
      // 0x185377af / 0x00001b01 = 0xe69d
      // 0x185377af % 0x00001b01 = 0x0212
      // 408123311 / 6913 = 59037
      // 408123311 % 6913 = 530
      ['af775318', '011b', '9de600', '1202'],
      // 15/4 = 3 (and negative operands)
      ['0f', '04', '03', '03'],
      // 15000/4 = 3750 (and negative operands)
      ['983a', '04', 'a60e', ''],
      // 15000/4000 = 3 (and negative operands)
      ['983a', 'a00f', '03', 'b80b'],
      // 15000000/4000 = 3750 (and negative operands)
      ['c0e1e400', 'a00f', 'a60e', ''],
      // 15000000/4 = 3750000 (and negative operands)
      ['c0e1e400', '04', '703839', ''],
      // 56488123 % 321 = 148 (and negative operands)
      ['bbf05d03', '4101', '67af02', '9400'],
      // 56488123 % 3 = 1 (and negative operands)
      ['bbf05d03', '03', '3e501f01', '01'],
      // 56488123 % 564881230 = 56488123 (and negative operands)
      ['bbf05d03', '4e67ab21', '', 'bbf05d03']
    ];

    for (const test of arithmeticTestCases) {
      const a = Buffer.from(test[0], 'hex');
      const b = Buffer.from(test[1], 'hex');
      const div = new Stack([Buffer.from(test[2], 'hex')]);
      const mod = new Stack([Buffer.from(test[3], 'hex')]);
      testDivModOp(a, b, div, mod);
    }
  });

  for (const op of ['OP_DIV', 'OP_MOD']) {
    it(`should fail ${op} for less than 2 stack items`, async () => {
      let stack = new Stack();
      isError(stack, Script.fromString(op), 'INVALID_STACK_OPERATION');

      stack = new Stack([EMPTY]);
      isError(stack, Script.fromString(op), 'INVALID_STACK_OPERATION');
    });

    it(`should fail ${op} for invalid numbers`, async () => {
      // CheckOps not valid numbers
      let stack = new Stack([
        Buffer.from('0102030405', 'hex'),
        Buffer.from('0102030405', 'hex')
      ]);
      isError(stack, Script.fromString(op), 'UNKNOWN_ERROR');

      stack = new Stack([
        Buffer.from('0102030405', 'hex'),
        Buffer.from('01', 'hex')
      ]);
      isError(stack, Script.fromString(op), 'UNKNOWN_ERROR');

      stack = new Stack([
        Buffer.from('0105', 'hex'),
        Buffer.from('0102030405', 'hex')
      ]);
      isError(stack, Script.fromString(op), 'UNKNOWN_ERROR');
    });
  }

  it('should fail OP_DIV when divided by zero', async () => {
    // Div/Mod by Zero (zero is minimal encoded)
    const stack = new Stack([Buffer.from('12', 'hex'), EMPTY]);
    isError(stack, Script.fromString('OP_DIV'), 'DIV_BY_ZERO');
  });

  it('should fail OP_MOD when mod by zero', async () => {
    const stack = new Stack([Buffer.from('12', 'hex'), EMPTY]);
    isError(stack, Script.fromString('OP_MOD'), 'MOD_BY_ZERO');
  });
});
