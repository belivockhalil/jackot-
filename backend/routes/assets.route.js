const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('assets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ assets: data });
});

router.post('/', async (req, res) => {
  const { userId, name, category, purchase_date, purchase_price, current_value, depreciation_rate, notes } = req.body;
  const { data, error } = await supabase.from('assets').insert([{ user_id: userId, name, category, purchase_date, purchase_price, current_value, depreciation_rate, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ asset: data });
});

router.put('/:id', async (req, res) => {
  const { name, category, purchase_date, purchase_price, current_value, depreciation_rate, notes } = req.body;
  const { data, error } = await supabase.from('assets').update({ name, category, purchase_date, purchase_price, current_value, depreciation_rate, notes }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ asset: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('assets').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;