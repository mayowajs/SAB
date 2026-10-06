const isValidEmail = (email) =>
  typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isValidName = (name) =>
  typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 80;

const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 8 && password.length <= 128;

const isValidAccountNumber = (accountNumber) =>
  typeof accountNumber === 'string' && /^\d{10}$/.test(accountNumber);

const isValidTransferAmount = (amount) =>
  typeof amount === 'number' && Number.isFinite(amount) && amount > 0;

const canViewTransaction = (transaction, userId) => {
  if (!transaction || !userId) return false;
  const idOf = (value) => value?._id?.toString() || value?.toString();
  const requesterId = idOf(userId);
  return [transaction.sender, transaction.receiver].some((participant) => idOf(participant) === requesterId);
};

module.exports = {
  canViewTransaction,
  isValidAccountNumber,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidTransferAmount,
};