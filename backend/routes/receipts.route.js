const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('receipts').select('*, clients(name, phone, email)').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ receipts: data });
});

router.post('/', async (req, res) => {
  const { userId, client_id, receipt_number, date, amount, payment_method, description, notes } = req.body;
  const { data, error } = await supabase.from('receipts').insert([{ user_id: userId, client_id, receipt_number, date, amount, payment_method, description, notes }]).select('*, clients(name, phone, email)').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ receipt: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('receipts').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;