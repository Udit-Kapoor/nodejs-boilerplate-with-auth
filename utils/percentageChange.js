const percChange = (a, b) => {
  if (a == null) a = 0;
  if (b == 0 || b == null) {
    // infinity case
    return '∞';
  }
  return ((a - b) / b) * 100;
};

module.exports = percChange;
