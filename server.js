const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();


app.use(cors());


routes(app);

const port = process.env.PORT || 4000;

app.listen(port);
