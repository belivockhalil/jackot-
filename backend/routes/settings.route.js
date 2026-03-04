// ─────────────────────────────────────────────────────
// JACKOT — Settings Route
// Every business owner's preferences — fully soft coded
// ─────────────────────────────────────────────────────

const express   = require('express');
const router    = express.Router();
const supabase  = require('../config/supabase');
const appConfig = require('../config/app.config');

// ── GET settings for a user ───────────────────────────
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({
        success:  true,
        source:   'defaults',
        settings: {
          ...appConfig.defaults,
          ...appConfig.theme,
        }
      });
    }

    if (error) throw error;

    const merged = {
      ...appConfig.defaults,
      ...appConfig.theme,
      ...data,
    };

    res.json({ success: true, source: 'database', settings: merged });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST create settings for new user ────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, businessName, currency, currencySymbol, language, greetingName } = req.body;

    const { data, error } = await supabase
      .from('settings')
      .insert({
        user_id:         userId,
        business_name:   businessName   || 'My Business',
        currency:        currency       || appConfig.defaults.currency,
        currency_symbol: currencySymbol || appConfig.defaults.currencySymbol,
        language:        language       || appConfig.defaults.language,
        greeting_name:   greetingName   || 'Friend',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, settings: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH update any setting ──────────────────────────
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates    = req.body;

    // Remove fields that don't exist in the settings table
    const allowed = [
      'business_name', 'greeting_name', 'business_phone', 'business_email',
      'business_address', 'currency', 'currency_symbol', 'language',
      'date_format', 'timezone', 'tax_rate', 'tax_label',
      'invoice_prefix', 'invoice_notes', 'invoice_color',
      'theme_primary', 'theme_accent', 'theme_background',
    ];

    const clean = {};
    allowed.forEach(key => {
      if (updates[key] !== undefined) clean[key] = updates[key];
    });

    clean.updated_at = new Date().toISOString();

    // Check if settings row exists first
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    let data, error;

    if (existing) {
      ({ data, error } = await supabase
        .from('settings')
        .update(clean)
        .eq('user_id', userId)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('settings')
        .insert({ user_id: userId, ...clean })
        .select()
        .single());
    }

    if (error) throw error;

    res.json({ success: true, settings: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;