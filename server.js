const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
require('colors');
const { oauth2Client } = require('./controllers/auth/googleAuthController');
const {
  twitterClient,
  twitterAuthClient,
} = require('./controllers/auth/twitterAuthController');
const Moralis = require('moralis').default;

require('dotenv').config();

const app = express();

// 1) GLOBAL MIDDLEWARES

// const options = {
//   origin: "https://www.dyor.ag/",
// };
// Add cross origin
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
}
app.use(morgan('dev'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injections
app.use(mongoSanitize());

// Data sanitizers against XSS
app.use(xss());

// ROUTES
app.get('/', (req, res) => {
  res.send('Server started successfully');
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error middleware
app.use(globalErrorHandler);

// Database connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
  })
  .then((con) => {
    console.log('DB connection successful');
  });

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
}).then((con) => {
  console.log('Moralis connection successful');
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`App running ${process.env.NODE_ENV} on port ${PORT}...`);
});

process.on('unhandledRejection', (err) => {
  console.error(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
