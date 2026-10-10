const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://74552fcd380a1a2ed03c8ad88a27ad2e@o4512219399323649.ingest.de.sentry.io/4512221696884816',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
});

module.exports = Sentry;
