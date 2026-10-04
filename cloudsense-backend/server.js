const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler.middleware');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const awsRoutes = require('./routes/aws.routes');
const budgetRoutes = require('./routes/budget.routes');
const usageRoutes = require('./routes/usage.routes');
const anomalyRoutes = require('./routes/anomaly.routes');
const alertRoutes = require('./routes/alert.routes');

const { startUsagePoller } = require('./jobs/usagePoller.job');
const { startAnomalyScanner } = require('./jobs/anomalyScanner.job');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/alerts', alertRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`CloudSense backend running on port ${PORT}`);

  if (process.env.NODE_ENV !== 'test') {
    startUsagePoller();
    startAnomalyScanner();
  }
});

module.exports = app;
