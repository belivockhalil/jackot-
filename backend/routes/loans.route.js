const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('loans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ loans: data });
});

router.post('/', async (req, res) => {
  const { userId, type, lender, principal, interest_rate, start_date, end_date, notes } = req.body;
  const { data, error } = await supabase.from('loans').insert([{ user_id: userId, type, lender, principal, interest_rate, start_date, end_date, total_repaid: 0, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ loan: data });
});

router.put('/:id', async (req, res) => {
  const { type, lender, principal, interest_rate, start_date, end_date, total_repaid, notes } = req.body;
  const { data, error } = await supabase.from('loans').update({ type, lender, principal, interest_rate, start_date, end_date, total_repaid, notes }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ loan: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('loans').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;