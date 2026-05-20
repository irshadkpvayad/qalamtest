require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

// Initialize Express app
const app = express();

// Session store: use pg-backed store only when SUPABASE_DB_URL is set and we're
// NOT in a serverless environment (Vercel workers die between requests, so
// pg-connect-simple causes crash-on-cold-start if the DB pool can't connect).
let sessionStore;
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless && process.env.SUPABASE_DB_URL) {
  try {
    const { Pool } = require('pg');
    const pgSession = require('connect-pg-simple')(session);
    const dbPool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
    dbPool.on('error', (err) => console.error('Unexpected DB pool error', err));
    sessionStore = new pgSession({ pool: dbPool, tableName: 'session' });
    console.log('Using PostgreSQL session store.');
  } catch (e) {
    console.warn('Failed to init pg session store, falling back to memory store:', e.message);
  }
}

if (!sessionStore) {
  console.log('Using in-memory session store (sessions will not persist across restarts).');
}

// Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(session({
  store: sessionStore, // undefined = default MemoryStore (fine for serverless)
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Flash messages
app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Import Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

// Use Routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('404', { title: '404 - ഈ പേജ് കണ്ടെത്തിയില്ല', layout: 'layouts/main' });
});

// 500 Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: '500 - സെർവർ പിശക്', layout: 'layouts/main' });
});

// Initialize Scheduled Tasks only in persistent (non-serverless) environments
if (!isServerless) {
  require('./services/scheduler');
}

// Start server if run directly (local development / VPS)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export for serverless environments (Vercel)
module.exports = app;
