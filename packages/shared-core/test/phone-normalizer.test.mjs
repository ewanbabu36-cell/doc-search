import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INDIAN_MOBILE_REGEX,
  clean10DigitMobile,
  isValidIndianMobile,
  format10DigitMobile,
  sanitizeIndianMobileInput,
  normalizePhoneNumber
} from '../dist/clinical/phone-normalizer.js';

test('Indian 10-Digit Mobile Utilities', async (t) => {
  await t.test('Validates standard 10-digit numbers starting with 6, 7, 8, 9', () => {
    assert.equal(isValidIndianMobile('9876543210'), true);
    assert.equal(isValidIndianMobile('8123456789'), true);
    assert.equal(isValidIndianMobile('7012345678'), true);
    assert.equal(isValidIndianMobile('6301234567'), true);

    // With +91
    assert.equal(isValidIndianMobile('+91 98765 43210'), true);
    assert.equal(isValidIndianMobile('+919876543210'), true);
    assert.equal(isValidIndianMobile('09876543210'), true);

    // Invalid numbers
    assert.equal(isValidIndianMobile('5123456789'), false); // Starts with 5
    assert.equal(isValidIndianMobile('1234567890'), false); // Starts with 1
    assert.equal(isValidIndianMobile('987654321'), false);  // 9 digits
    assert.equal(isValidIndianMobile('98765432100'), false); // 11 digits
    assert.equal(isValidIndianMobile('abcdefghij'), false);
    assert.equal(isValidIndianMobile(''), false);
    assert.equal(isValidIndianMobile(null), false);
  });

  await t.test('clean10DigitMobile extracts clean 10 digits', () => {
    assert.equal(clean10DigitMobile('+91 98765 43210'), '9876543210');
    assert.equal(clean10DigitMobile('91-98765-43210'), '9876543210');
    assert.equal(clean10DigitMobile('09876543210'), '9876543210');
    assert.equal(clean10DigitMobile('9876543210'), '9876543210');
  });

  await t.test('sanitizeIndianMobileInput filters non-digits and caps at 10', () => {
    assert.equal(sanitizeIndianMobileInput('98a76b54c3210'), '9876543210');
    assert.equal(sanitizeIndianMobileInput('+91 98765 43210'), '9876543210');
    assert.equal(sanitizeIndianMobileInput('09876543210'), '9876543210');
    assert.equal(sanitizeIndianMobileInput('98765432109999'), '9876543210');
  });

  await t.test('format10DigitMobile formats correctly', () => {
    assert.equal(format10DigitMobile('9876543210', true), '+91 98765 43210');
    assert.equal(format10DigitMobile('9876543210', false), '98765 43210');
  });
});
