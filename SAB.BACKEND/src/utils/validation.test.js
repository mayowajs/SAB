const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canViewTransaction,
  isValidAccountNumber,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidTransferAmount,
} = require('./validation');

test('validates registration fields', () => {
  assert.equal(isValidName('Taiwo Example'), true);
  assert.equal(isValidName(' '), false);
  assert.equal(isValidEmail('person@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidPassword('long-enough'), true);
  assert.equal(isValidPassword('short'), false);
});

test('accepts only valid transfer destinations and amounts', () => {
  assert.equal(isValidAccountNumber('1234567890'), true);
  assert.equal(isValidAccountNumber('12345'), false);
  assert.equal(isValidTransferAmount(25), true);
  assert.equal(isValidTransferAmount(0), false);
  assert.equal(isValidTransferAmount(Number.NaN), false);
  assert.equal(isValidTransferAmount('25'), false);
});

test('transaction details are visible only to sender or receiver', () => {
  const transaction = {
    sender: { _id: 'sender-id' },
    receiver: { _id: 'receiver-id' },
  };

  assert.equal(canViewTransaction(transaction, 'sender-id'), true);
  assert.equal(canViewTransaction(transaction, 'receiver-id'), true);
  assert.equal(canViewTransaction(transaction, 'other-id'), false);
  assert.equal(canViewTransaction(null, 'sender-id'), false);
});