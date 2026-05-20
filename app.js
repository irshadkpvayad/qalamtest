require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');

// Initialize Express app
const app = express();

// Database Pool for session store
const dbPool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

// Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for simplicity, enable in production with proper config for CDNs
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
  store: new pgSession({
    pool: dbPool,
    tableName: 'session' // Use connect-pg-simple default table 'session'
  }),
  secret: process.env.SESSION_SECRET || 'secret',
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

// Ensure database pool handles errors
dbPool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

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

// Initialize Scheduled Tasks
require('./services/scheduler');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
