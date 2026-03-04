const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('savings').select('*').eq('user_id', userId).order('date', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const balance  = data.reduce((s, e) => s + (e.direction === 'in' ? Number(e.amount) : -Number(e.amount)), 0);
  res.json({ entries: data, balance });
});

router.post('/', async (req, res) => {
  const { userId, date, amount, direction, notes } = req.body;
  const { data: prev } = await supabase.from('savings').select('balance').eq('user_id', userId).order('date', { ascending: false }).limit(1).single();
  const lastBalance = Number(prev?.balance || 0);
  const newBalance  = direction === 'in' ? lastBalance + Number(amount) : lastBalance - Number(amount);
  const { data, error } = await supabase.from('savings').insert([{ user_id: userId, date, amount, direction, balance: newBalance, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ entry: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('savings').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;