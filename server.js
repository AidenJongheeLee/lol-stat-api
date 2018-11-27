const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();


app.use(cors());


app.use('/', (req, res) => {
  res.json('this is lol stat api');
});


routes(app);

const port = process.env.PORT || 4000;

app.listen(port);
