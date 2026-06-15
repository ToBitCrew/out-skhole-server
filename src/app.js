const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const routes = require('./routes/index');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => { req.body = req.body ?? {}; next(); });

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    if (req.method !== 'GET') console.log('  body:', JSON.stringify(req.body));
    next();
  });
}

app.get('/', (req, res) => res.json({ message: '서버 정상 작동 중' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
