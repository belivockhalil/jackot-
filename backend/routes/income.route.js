// ─────────────────────────────────────────────────────
// JACKOT — Income Route
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all income entries ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('income_entries')
      .select('*, clients(name), projects(name), income_sources(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    const total = data.reduce((sum, e) => sum + Number(e.amount), 0);

    res.json({
      success: true,
      total:   data.length,
      amount:  total,
      entries: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET income summary by month ───────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { userId, year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('income_entries')
      .select('date, amount')
      .eq('user_id', userId)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (error) throw error;

    // Group by month — soft coded, no month names hardcoded
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month:  i + 1,
      amount: 0,
    }));

    data.forEach(entry => {
      const month = new Date(entry.date).getMonth();
      monthly[month].amount += Number(entry.amount);
    });

    res.json({
      success: true,
      year:    currentYear,
      monthly,
      total:   data.reduce((sum, e) => sum + Number(e.amount), 0),
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST record income ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      date,
      sourceId,
      projectId,
      clientId,
      amount,
      collectionPoint,
      referenceCode,
      notes,
    } = req.body;

    const { data, error } = await supabase
      .from('income_entries')
      .insert({
        user_id:          userId,
        date:             date || new Date().toISOString().split('T')[0],
        source_id:        sourceId,
        project_id:       projectId,
        client_id:        clientId,
        amount,
        collection_point: collectionPoint,
        reference_code:   referenceCode,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Update client total_billed if client is linked
    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('total_billed')
        .eq('id', clientId)
        .single();

      await supabase
        .from('clients')
        .update({ total_billed: Number(client.total_billed) + Number(amount) })
        .eq('id', clientId);
    }

    res.json({
      success: true,
      message: `Income of ${amount} recorded successfully`,
      entry:   data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE income entry ───────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('income_entries')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Income entry deleted' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;