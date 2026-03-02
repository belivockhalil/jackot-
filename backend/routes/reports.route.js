// ─────────────────────────────────────────────────────
// JACKOT — Reports Route
// All financial summaries — fully calculated from data
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET full dashboard summary ────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch income, expenses, clients, suppliers in parallel
    const [incomeRes, expenseRes, clientsRes, suppliersRes] = await Promise.all([
      supabase.from('income_entries').select('amount').eq('user_id', userId),
      supabase.from('expense_entries').select('amount').eq('user_id', userId),
      supabase.from('clients').select('total_billed, total_paid').eq('user_id', userId),
      supabase.from('suppliers').select('total_owed, total_paid').eq('user_id', userId),
    ]);

    const totalIncome   = incomeRes.data?.reduce((s, e) => s + Number(e.amount), 0) || 0;
    const totalExpenses = expenseRes.data?.reduce((s, e) => s + Number(e.amount), 0) || 0;
    const grossProfit   = totalIncome - totalExpenses;

    const totalDebtors  = clientsRes.data?.reduce((s, c) =>
      s + (Number(c.total_billed) - Number(c.total_paid)), 0) || 0;

    const totalCreditors = suppliersRes.data?.reduce((s, sup) =>
      s + (Number(sup.total_owed) - Number(sup.total_paid)), 0) || 0;

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        grossProfit,
        totalDebtors,
        totalCreditors,
      },
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET income vs expenses by month ──────────────────
router.get('/monthly', async (req, res) => {
  try {
    const { userId, year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const [incomeRes, expenseRes] = await Promise.all([
      supabase.from('income_entries').select('date, amount').eq('user_id', userId)
        .gte('date', `${currentYear}-01-01`).lte('date', `${currentYear}-12-31`),
      supabase.from('expense_entries').select('date, amount').eq('user_id', userId)
        .gte('date', `${currentYear}-01-01`).lte('date', `${currentYear}-12-31`),
    ]);

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month:    i + 1,
      income:   0,
      expenses: 0,
      profit:   0,
    }));

    incomeRes.data?.forEach(e => {
      const m = new Date(e.date).getMonth();
      monthly[m].income += Number(e.amount);
    });

    expenseRes.data?.forEach(e => {
      const m = new Date(e.date).getMonth();
      monthly[m].expenses += Number(e.amount);
    });

    monthly.forEach(m => { m.profit = m.income - m.expenses; });

    res.json({ success: true, year: currentYear, monthly });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET top clients by revenue ────────────────────────
router.get('/top-clients', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('clients')
      .select('name, total_billed, total_paid')
      .eq('user_id', userId)
      .order('total_billed', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ success: true, clients: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET debtors report ────────────────────────────────
router.get('/debtors', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('clients')
      .select('name, phone, total_billed, total_paid')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    const debtors = data
      .map(c => ({
        name:       c.name,
        phone:      c.phone,
        billed:     Number(c.total_billed),
        paid:       Number(c.total_paid),
        balance:    Number(c.total_billed) - Number(c.total_paid),
      }))
      .filter(c => c.balance > 0);

    const totalOwed = debtors.reduce((s, c) => s + c.balance, 0);

    res.json({ success: true, totalOwed, debtors });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET creditors report ──────────────────────────────
router.get('/creditors', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('suppliers')
      .select('name, phone, total_owed, total_paid')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    const creditors = data
      .map(s => ({
        name:    s.name,
        phone:   s.phone,
        owed:    Number(s.total_owed),
        paid:    Number(s.total_paid),
        balance: Number(s.total_owed) - Number(s.total_paid),
      }))
      .filter(s => s.balance > 0);

    const totalOwed = creditors.reduce((s, c) => s + c.balance, 0);

    res.json({ success: true, totalOwed, creditors });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;