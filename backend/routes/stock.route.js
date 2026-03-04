const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('stock').select('*, stock_movements(*)').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ stock: data });
});

router.post('/', async (req, res) => {
  const { userId, name, category, quantity, unit, buying_price, selling_price, low_stock_alert, notes } = req.body;
  const { data, error } = await supabase.from('stock').insert([{ user_id: userId, name, category, quantity, unit, buying_price, selling_price, low_stock_alert, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ item: data });
});

router.put('/:id', async (req, res) => {
  const { name, category, quantity, unit, buying_price, selling_price, low_stock_alert, notes } = req.body;
  const { data, error } = await supabase.from('stock').update({ name, category, quantity, unit, buying_price, selling_price, low_stock_alert, notes }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ item: data });
});

router.delete('/:id', async (req, res) => {
  await supabase.from('stock_movements').delete().eq('stock_id', req.params.id);
  const { error } = await supabase.from('stock').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

router.post('/:id/move', async (req, res) => {
  const { userId, type, quantity, date, notes } = req.body;
  const { data: item } = await supabase.from('stock').select('quantity').eq('id', req.params.id).single();
  const newQty = type === 'in' ? Number(item.quantity) + Number(quantity) : Number(item.quantity) - Number(quantity);
  await supabase.from('stock').update({ quantity: newQty }).eq('id', req.params.id);
  const { data, error } = await supabase.from('stock_movements').insert([{ stock_id: req.params.id, user_id: userId, type, quantity, date, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ movement: data, new_quantity: newQty });
});

module.exports = router;