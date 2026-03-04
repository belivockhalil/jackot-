const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('tax_entries').select('*').eq('user_id', userId).order('due_date', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ taxes: data });
});

router.post('/', async (req, res) => {
  const { userId, tax_type, amount, due_date, reference, notes } = req.body;
  const { data, error } = await supabase.from('tax_entries').insert([{ user_id: userId, tax_type, amount, due_date, status: 'pending', reference, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ tax: data });
});

router.put('/:id', async (req, res) => {
  const { tax_type, amount, due_date, paid_date, status, reference, notes } = req.body;
  const { data, error } = await supabase.from('tax_entries').update({ tax_type, amount, due_date, paid_date, status, reference, notes }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ tax: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('tax_entries').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;