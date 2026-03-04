const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('staff').select('*, staff_payments(*)').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ staff: data });
});

router.post('/', async (req, res) => {
  const { userId, name, role, phone, email, salary, start_date, notes } = req.body;
  const { data, error } = await supabase.from('staff').insert([{ user_id: userId, name, role, phone, email, salary, start_date, status: 'active', notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ member: data });
});

router.put('/:id', async (req, res) => {
  const { name, role, phone, email, salary, start_date, status, notes } = req.body;
  const { data, error } = await supabase.from('staff').update({ name, role, phone, email, salary, start_date, status, notes }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ member: data });
});

router.delete('/:id', async (req, res) => {
  await supabase.from('staff_payments').delete().eq('staff_id', req.params.id);
  const { error } = await supabase.from('staff').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

router.post('/:id/pay', async (req, res) => {
  const { userId, amount, payment_date, month, notes } = req.body;
  const { data, error } = await supabase.from('staff_payments').insert([{ staff_id: req.params.id, user_id: userId, amount, payment_date, month, notes }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ payment: data });
});

module.exports = router;