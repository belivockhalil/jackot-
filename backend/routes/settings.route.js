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

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, settings: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;