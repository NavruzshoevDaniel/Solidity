module.exports = {
  solcOptimizerDetails: {
    enabled: true,
    runs: 200,
  },
  mocha: {
    grep: '@skip-on-coverage',
    invert: true
  },
  checkCoverage: true
};
