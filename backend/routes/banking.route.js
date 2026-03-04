// ─────────────────────────────────────────────────────
// JACKOT — Banking Route
// Fully flexible — any bank, mobile money, or platform
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET all accounts for a user ───────────────────────
router.get('/accounts', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    res.json({ success: true, accounts: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST create a new account ─────────────────────────
router.post('/accounts', async (req, res) => {
  try {
    const { userId, name, type, color, icon } = req.body;

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({ user_id: userId, name, type, color, icon })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: `${name} account added`, account: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE an account ─────────────────────────────────
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Account removed' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET ledger entries for one account ────────────────
router.get('/ledger/:accountId', async (req, res) => {
  try {
    const { userId } = req.query;
    const { accountId } = req.params;

    const { data, error } = await supabase
      .from('bank_ledger')
      .select('*')
      .eq('user_id', userId)
      .eq('ledger_type', accountId)
      .order('date', { ascending: false });

    if (error) throw error;

    const totalIn  = data.reduce((s, e) => s + Number(e.amount_in  || 0), 0);
    const totalOut = data.reduce((s, e) => s + Number(e.amount_out || 0), 0);
    const balance  = totalIn - totalOut;

    res.json({ success: true, totalIn, totalOut, balance, entries: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET summary of all accounts ───────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('bank_ledger')
      .select('ledger_type, amount_in, amount_out')
      .eq('user_id', userId);

    if (error) throw error;

    const summary = data.reduce((acc, entry) => {
      if (!acc[entry.ledger_type]) {
        acc[entry.ledger_type] = { totalIn: 0, totalOut: 0, balance: 0 };
      }
      acc[entry.ledger_type].totalIn  += Number(entry.amount_in  || 0);
      acc[entry.ledger_type].totalOut += Number(entry.amount_out || 0);
      acc[entry.ledger_type].balance   =
        acc[entry.ledger_type].totalIn - acc[entry.ledger_type].totalOut;
      return acc;
    }, {});

    const grandTotal = Object.values(summary).reduce((s, l) => s + l.balance, 0);

    res.json({ success: true, summary, grandTotal });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST record a transaction ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      accountId,
      date,
      description,
      amountIn,
      amountOut,
      linkedType,
      linkedId,
      referenceCode,
    } = req.body;

    // Get last balance for this account
    const { data: existing } = await supabase
      .from('bank_ledger')
      .select('balance')
      .eq('user_id', userId)
      .eq('ledger_type', accountId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastBalance = existing?.[0]?.balance || 0;
    const newBalance  = lastBalance + Number(amountIn || 0) - Number(amountOut || 0);

    const { data, error } = await supabase
      .from('bank_ledger')
      .insert({
        user_id:        userId,
        ledger_type:    accountId,
        date:           date || new Date().toISOString().split('T')[0],
        description,
        amount_in:      amountIn  || 0,
        amount_out:     amountOut || 0,
        balance:        newBalance,
        linked_type:    linkedType,
        linked_id:      linkedId,
        reference_code: referenceCode,
      })
      .select()
      .single();

    if (error) throw error;

    // Smart — if paying a supplier reduce their balance
    if (linkedType === 'supplier' && linkedId && amountOut) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('total_owed, total_paid')
        .eq('id', linkedId)
        .single();

      await supabase
        .from('suppliers')
        .update({
          total_paid: Number(supplier.total_paid) + Number(amountOut),
          total_owed: Math.max(0, Number(supplier.total_owed) - Number(amountOut)),
        })
        .eq('id', linkedId);
    }

    // Smart — if receiving from client update their total_paid
    if (linkedType === 'client' && linkedId && amountIn) {
      const { data: client } = await supabase
        .from('clients')
        .select('total_paid')
        .eq('id', linkedId)
        .single();

      await supabase
        .from('clients')
        .update({ total_paid: Number(client.total_paid) + Number(amountIn) })
        .eq('id', linkedId);
    }

    res.json({ success: true, message: 'Transaction recorded', newBalance, entry: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;