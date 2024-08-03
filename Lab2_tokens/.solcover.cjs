module.exports = {
  solcOptimizerDetails: {
    enabled: true,
    runs: 200,
  },
  mocha: {
    grep: '@skip-on-coverage',
    invert: true
  },
  checkCoverage: true,
  coverage: {
    statements: 99,
    branches: 99,
    functions: 99,
    lines: 99,
  },
};
