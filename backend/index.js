// ─────────────────────────────────────────────────────
// JACKOT — Main Server Entry Point
// ─────────────────────────────────────────────────────

const express   = require('express');
const cors      = require('cors');
require('dotenv').config();

const appConfig = require('./config/app.config');

const app  = express();
const PORT = process.env.PORT || appConfig.defaults.port || 4000;

// ── Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check Route ────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'running',
    app:     appConfig.app.name,
    version: appConfig.app.version,
    message: `${appConfig.app.name} API is alive!`,
  });
});

// ── Start Server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  ${appConfig.app.name} server running on http://localhost:${PORT}`);
});