const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if (req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
};

app.configure(() => {
  app.use(cors());
});

app.use('/', (req, res) => {
  res.json('this is lol stat api');
});


routes(app);

const port = process.env.PORT || 4000;

app.listen(port);
