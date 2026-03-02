// ─────────────────────────────────────────────────────
// JACKOT — Banking Route
// Cash, Mpesa, Bank ledgers — smart creditor payments
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET ledger entries by type ────────────────────────
// type = cash | mpesa | kcb | ncba
router.get('/:ledgerType', async (req, res) => {
  try {
    const { userId } = req.query;
    const { ledgerType } = req.params;

    const { data, error } = await supabase
      .from('bank_ledger')
      .select('*')
      .eq('user_id', userId)
      .eq('ledger_type', ledgerType)
      .order('date', { ascending: false });

    if (error) throw error;

    const totalIn  = data.reduce((sum, e) => sum + Number(e.amount_in), 0);
    const totalOut = data.reduce((sum, e) => sum + Number(e.amount_out), 0);
    const balance  = totalIn - totalOut;

    res.json({
      success:    true,
      ledgerType,
      totalIn,
      totalOut,
      balance,
      entries:    data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET all ledgers summary ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('bank_ledger')
      .select('ledger_type, amount_in, amount_out')
      .eq('user_id', userId);

    if (error) throw error;

    // Group by ledger type — soft coded
    const summary = data.reduce((acc, entry) => {
      if (!acc[entry.ledger_type]) {
        acc[entry.ledger_type] = { totalIn: 0, totalOut: 0, balance: 0 };
      }
      acc[entry.ledger_type].totalIn  += Number(entry.amount_in);
      acc[entry.ledger_type].totalOut += Number(entry.amount_out);
      acc[entry.ledger_type].balance   = acc[entry.ledger_type].totalIn - acc[entry.ledger_type].totalOut;
      return acc;
    }, {});

    const grandTotal = Object.values(summary).reduce((sum, l) => sum + l.balance, 0);

    res.json({
      success:    true,
      summary,
      grandTotal,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST record a transaction ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      ledgerType,
      date,
      description,
      amountIn,
      amountOut,
      linkedType,
      linkedId,
      referenceCode,
    } = req.body;

    // Get current balance for this ledger
    const { data: existing } = await supabase
      .from('bank_ledger')
      .select('balance')
      .eq('user_id', userId)
      .eq('ledger_type', ledgerType)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastBalance = existing?.[0]?.balance || 0;
    const newBalance  = lastBalance + Number(amountIn || 0) - Number(amountOut || 0);

    const { data, error } = await supabase
      .from('bank_ledger')
      .insert({
        user_id:        userId,
        ledger_type:    ledgerType,
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

    // Smart creditor payment — if paying a supplier, reduce their balance
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

    // If receiving payment from client, update their total_paid
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

    res.json({
      success:    true,
      message:    'Transaction recorded successfully',
      newBalance,
      entry:      data,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;