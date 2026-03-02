// ─────────────────────────────────────────────────────
// JACKOT — Clients Route
// Add, view, edit and delete clients — soft coded
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all clients for a user ────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      total:   data.length,
      clients: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET single client by id ───────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, client: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST create a new client ──────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      name,
      phone,
      email,
      location,
      notes,
    } = req.body;

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id:  userId,
        name,
        phone,
        email,
        location,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Client ${name} added successfully`,
      client:  data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH update a client ─────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { id }     = req.params;
    const updates    = req.body;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, client: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE a client ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Client deleted successfully' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;