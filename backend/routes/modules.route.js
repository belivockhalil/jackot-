// ─────────────────────────────────────────────────────
// JACKOT — Modules Route
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all modules grouped by category ──────────────
router.get('/grouped', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    const grouped = data.reduce((acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    }, {});

    res.json({ success: true, total: data.length, grouped });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET all modules flat list ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    res.json({ success: true, total: data.length, modules: data });

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

    res.json({ success: true, userId, modules: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH toggle a module on or off ──────────────────
router.patch('/toggle', async (req, res) => {
  try {
    const { userId, moduleKey, isEnabled } = req.body;

    // Check if row already exists
    const { data: existing } = await supabase
      .from('user_modules')
      .select('id')
      .eq('user_id', userId)
      .eq('module_key', moduleKey)
      .single();

    let data, error;

    if (existing) {
      // Update existing row
      ({ data, error } = await supabase
        .from('user_modules')
        .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('module_key', moduleKey)
        .select()
        .single());
    } else {
      // Insert new row
      ({ data, error } = await supabase
        .from('user_modules')
        .insert({ user_id: userId, module_key: moduleKey, is_enabled: isEnabled })
        .select()
        .single());
    }

    if (error) throw error;

    res.json({
      success: true,
      message: `Module ${moduleKey} is now ${isEnabled ? 'ON' : 'OFF'}`,
      module:  data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
