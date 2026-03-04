// ─────────────────────────────────────────────────────
// JACKOT — Main Server Entry Point
// ─────────────────────────────────────────────────────

const express   = require('express');
const cors      = require('cors');
require('dotenv').config();

const appConfig = require('./config/app.config');
const supabase  = require('./config/supabase');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────
const modulesRoute = require('./routes/modules.route');
app.use('/api/v1/modules', modulesRoute);

const settingsRoute = require('./routes/settings.route');
app.use('/api/v1/settings', settingsRoute);

const authRoute = require('./routes/auth.route');
app.use('/api/v1/auth', authRoute);

const clientsRoute = require('./routes/clients.route');
app.use('/api/v1/clients', clientsRoute);

const suppliersRoute = require('./routes/suppliers.route');
app.use('/api/v1/suppliers', suppliersRoute);

const projectsRoute = require('./routes/projects.route');
app.use('/api/v1/projects', projectsRoute);

const incomeRoute = require('./routes/income.route');
app.use('/api/v1/income', incomeRoute);

const expensesRoute = require('./routes/expenses.route');
app.use('/api/v1/expenses', expensesRoute);

const bankingRoute = require('./routes/banking.route');
app.use('/api/v1/banking', bankingRoute);

const reportsRoute = require('./routes/reports.route');
app.use('/api/v1/reports', reportsRoute);

const excelRoutes = require('./routes/excel.route');
app.use('/api/v1/excel', excelRoutes);

const loansRoutes   = require('./routes/loans.route');
const savingsRoutes = require('./routes/savings.route');
const assetsRoutes  = require('./routes/assets.route');
const notebookRoutes= require('./routes/notebook.route');
const goalsRoutes   = require('./routes/goals.route');

app.use('/api/v1/loans',    loansRoutes);
app.use('/api/v1/savings',  savingsRoutes);
app.use('/api/v1/assets',   assetsRoutes);
app.use('/api/v1/notebook', notebookRoutes);
app.use('/api/v1/goals',    goalsRoutes);

// ── Health Check ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'running',
    app:     appConfig.app.name,
    version: appConfig.app.version,
    message: `${appConfig.app.name} API is alive!`,
  });
});

// ── Test Database Connection ──────────────────────────
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('category, name')
      .order('sort_order');

    if (error) throw error;

    res.json({
      status:   'connected',
      message:  'Database connection successful!',
      modules:  data.length,
      data:     data,
    });

  } catch (err) {
    res.status(500).json({
      status:  'error',
      message: err.message,
    });
  }
});

// ── Start Server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  ${appConfig.app.name} server running on http://localhost:${PORT}`);
});
