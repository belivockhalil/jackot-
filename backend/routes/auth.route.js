// ─────────────────────────────────────────────────────
// JACKOT — Auth Route
// Handles signup, login and logout
// Uses Supabase Auth — no passwords stored in our code
// ─────────────────────────────────────────────────────

const express   = require('express');
const router    = express.Router();
const supabase  = require('../config/supabase');
const appConfig = require('../config/app.config');

// ── POST /signup ──────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password, businessName, greetingName } = req.body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Create default settings for this new user
    const { error: settingsError } = await supabase
      .from('settings')
      .insert({
        user_id:         userId,
        business_name:   businessName  || 'My Business',
        greeting_name:   greetingName  || email.split('@')[0],
        currency:        appConfig.defaults.currency,
        currency_symbol: appConfig.defaults.currencySymbol,
        language:        appConfig.defaults.language,
        date_format:     appConfig.defaults.dateFormat,
        timezone:        appConfig.defaults.timezone,
        tax_rate:        appConfig.defaults.taxRate,
        tax_label:       appConfig.defaults.taxLabel,
        theme_primary:   appConfig.theme.primaryColor,
        theme_accent:    appConfig.theme.accentColor,
      });

    if (settingsError) throw settingsError;

    // 3. Turn ON default modules for this new user
    const { data: allModules } = await supabase
      .from('modules')
      .select('module_key')
      .eq('is_active', true);

    const defaultModules = [
      'income_tracker',
      'expense_tracker',
      'profit_loss',
      'client_directory',
      'debtors_report',
      'supplier_directory',
      'creditors_report',
      'cash_ledger',
      'mpesa_ledger',
      'graph_income_expense',
      'pie_expenses',
      'invoice_generator',
    ];

    const userModules = allModules.map(m => ({
      user_id:    userId,
      module_key: m.module_key,
      is_enabled: defaultModules.includes(m.module_key),
    }));

    const { error: modulesError } = await supabase
      .from('user_modules')
      .insert(userModules);

    if (modulesError) throw modulesError;

    res.json({
      success: true,
      message: `Welcome to Jackot, ${greetingName || email}!`,
      userId:  userId,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.json({
      success:      true,
      message:      'Login successful',
      userId:       data.user.id,
      email:        data.user.email,
      accessToken:  data.session.access_token,
      refreshToken: data.session.refresh_token,
    });

  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// ── POST /logout ──────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    res.json({ success: true, message: 'Logged out successfully' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;