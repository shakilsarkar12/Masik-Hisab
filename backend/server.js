require('dotenv').config();

// Override DNS to use Google's DNS (8.8.8.8) — fixes ECONNREFUSED on SRV lookup
// when Windows default DNS blocks MongoDB Atlas SRV records
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const incomeSourceRoutes = require('./routes/incomeSourceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { initCronScheduler } = require('./config/cronScheduler');

const app = express();

// Middlewares
const { clerkMiddleware, getAuth } = require('@clerk/express');

const requireAuth = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.auth = auth;
  next();
};

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://masikhisab.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(clerkMiddleware());

// Connect to MongoDB
connectDB();

// Initialize Scheduler
initCronScheduler();

// Mount routes
app.use('/api/incomes', requireAuth, incomeRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);
app.use('/api/budgets', requireAuth, budgetRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/income-sources', requireAuth, incomeSourceRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Personal Finance Dashboard API is running...');
});

// Port configuration
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in production/dev on port ${PORT}`);
});

module.exports = app;
