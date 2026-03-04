const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('business_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ goals: data });
});

router.post('/', async (req, res) => {
  const { userId, description, target_value, current_value, target_date, unit } = req.body;
  const { data, error } = await supabase.from('business_goals').insert([{ user_id: userId, description, target_value, current_value: current_value || 0, target_date, unit }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ goal: data });
});

router.put('/:id', async (req, res) => {
  const { description, target_value, current_value, target_date, unit } = req.body;
  const { data, error } = await supabase.from('business_goals').update({ description, target_value, current_value, target_date, unit }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ goal: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('business_goals').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;