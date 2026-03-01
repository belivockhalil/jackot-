// ─────────────────────────────────────────────────────
// JACKOT — Modules Route
// Handles all module on/off switching per business
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all available modules ─────────────────────────
// Returns the full master list from the database
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    res.json({
      success: true,
      total:   data.length,
      modules: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET modules grouped by category ──────────────────
router.get('/grouped', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    // Group by category — soft coded, no category names in code
    const grouped = data.reduce((acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    }, {});

    res.json({
      success:  true,
      total:    data.length,
      grouped:  grouped,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET user's enabled modules ────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_modules')
      .select('module_key, is_enabled')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      userId:  userId,
      modules: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH toggle a module on or off ──────────────────
router.patch('/toggle', async (req, res) => {
  try {
    const { userId, moduleKey, isEnabled } = req.body;

    const { data, error } = await supabase
      .from('user_modules')
      .upsert({
        user_id:    userId,
        module_key: moduleKey,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success:    true,
      message:    `Module ${moduleKey} is now ${isEnabled ? 'ON' : 'OFF'}`,
      module:     data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;