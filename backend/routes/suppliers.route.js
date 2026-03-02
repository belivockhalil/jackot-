// ─────────────────────────────────────────────────────
// JACKOT — Suppliers Route
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all suppliers ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    res.json({ success: true, total: data.length, suppliers: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET single supplier ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ success: true, supplier: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST create supplier ──────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, name, phone, email, itemsSupplied, notes } = req.body;

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        user_id:        userId,
        name,
        phone,
        email,
        items_supplied: itemsSupplied,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success:  true,
      message:  `Supplier ${name} added successfully`,
      supplier: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH update supplier ─────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, supplier: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE supplier ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Supplier deleted successfully' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;