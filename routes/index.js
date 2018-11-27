const matches = require('./matches');

module.exports = (app) => {
  app.use('/matches', matches);
};
