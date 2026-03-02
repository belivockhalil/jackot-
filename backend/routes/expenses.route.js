// ─────────────────────────────────────────────────────
// JACKOT — Expenses Route
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all expense entries ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('expense_entries')
      .select('*, expense_categories(name), projects(name), suppliers(name)')
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

// ── GET expenses summary by month ─────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { userId, year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('expense_entries')
      .select('date, amount, type')
      .eq('user_id', userId)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (error) throw error;

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

// ── POST record expense ───────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      date,
      categoryId,
      projectId,
      supplierId,
      amount,
      type,
      collectionPoint,
      referenceCode,
      notes,
    } = req.body;

    const { data, error } = await supabase
      .from('expense_entries')
      .insert({
        user_id:          userId,
        date:             date || new Date().toISOString().split('T')[0],
        category_id:      categoryId,
        project_id:       projectId,
        supplier_id:      supplierId,
        amount,
        type:             type || 'general',
        collection_point: collectionPoint,
        reference_code:   referenceCode,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Update supplier total_owed if supplier is linked
    if (supplierId) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('total_owed')
        .eq('id', supplierId)
        .single();

      await supabase
        .from('suppliers')
        .update({ total_owed: Number(supplier.total_owed) + Number(amount) })
        .eq('id', supplierId);
    }

    res.json({
      success: true,
      message: `Expense of ${amount} recorded successfully`,
      entry:   data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE expense entry ──────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('expense_entries')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Expense entry deleted' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;