// ─────────────────────────────────────────────────────
// JACKOT — Projects Route
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all projects ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(name, phone)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, total: data.length, projects: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET single project ────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(name, phone)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ success: true, project: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST create project ───────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      clientId,
      name,
      productType,
      contractAmount,
      estimatedCompletion,
      notes,
    } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id:              userId,
        client_id:            clientId,
        name,
        product_type:         productType,
        contract_amount:      contractAmount  || 0,
        estimated_completion: estimatedCompletion,
        notes:                notes ? [notes] : [],
        status:               'active',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Project ${name} created successfully`,
      project: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH update project ──────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, project: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH add a note to a project ─────────────────────
router.patch('/:id/note', async (req, res) => {
  try {
    const { note } = req.body;

    const { data: existing } = await supabase
      .from('projects')
      .select('notes')
      .eq('id', req.params.id)
      .single();

    const updatedNotes = [...(existing.notes || []), `${new Date().toISOString()}: ${note}`];

    const { data, error } = await supabase
      .from('projects')
      .update({ notes: updatedNotes, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, project: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE project ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Project deleted successfully' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;