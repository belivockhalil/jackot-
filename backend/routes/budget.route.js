const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId, month, year } = req.query;
  let query = supabase.from('budget_planner').select('*').eq('user_id', userId);
  if (month) query = query.eq('month', month);
  if (year)  query = query.eq('year', year);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ budgets: data });
});

router.post('/', async (req, res) => {
  const { userId, category, budgeted_amount, month, year, notes } = req.body;
  const { data, error } = await supabase.from('budget_planner').insert([{ user_id: userId, category, budgeted_amount, spent_amount: 0, month, year, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ budget: data });
});

router.put('/:id', async (req, res) => {
  const { category, budgeted_amount, spent_amount, month, year, notes } = req.body;
  const { data, error } = await supabase.from('budget_planner').update({ category, budgeted_amount, spent_amount, month, year, notes }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ budget: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('budget_planner').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;