const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase
    .from('job_quotes')
    .select('*, clients(name, phone, email), quote_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ quotes: data });
});

router.post('/', async (req, res) => {
  const { userId, client_id, quote_number, date, valid_until, status, notes, items } = req.body;
  const total_amount = (items || []).reduce((s, i) => s + Number(i.quantity||0) * Number(i.unit_price||0), 0);

  const { data: quote, error: qErr } = await supabase
    .from('job_quotes')
    .insert([{ user_id: userId, client_id, quote_number, date, valid_until, status: status||'draft', notes, total_amount }])
    .select()
    .single();

  if (qErr) return res.status(400).json({ error: qErr.message });

  if (items && items.length > 0) {
    const rows = items
      .filter(i => i.description)
      .map(i => ({
        quote_id:   quote.id,
        description: i.description,
        quantity:   Number(i.quantity  || 1),
        unit_price: Number(i.unit_price|| 0),
        total:      Number(i.quantity  || 1) * Number(i.unit_price || 0),
      }));
    if (rows.length > 0) {
      const { error: iErr } = await supabase.from('quote_items').insert(rows);
      if (iErr) console.error('Items insert error:', iErr.message);
    }
  }

  res.json({ quote });
});

router.put('/:id', async (req, res) => {
  const { client_id, quote_number, date, valid_until, status, notes, items } = req.body;
  const total_amount = (items || []).reduce((s, i) => s + Number(i.quantity||0) * Number(i.unit_price||0), 0);

  const { data: quote, error: qErr } = await supabase
    .from('job_quotes')
    .update({ client_id, quote_number, date, valid_until, status, notes, total_amount })
    .eq('id', req.params.id)
    .select()
    .single();

  if (qErr) return res.status(400).json({ error: qErr.message });

  await supabase.from('quote_items').delete().eq('quote_id', req.params.id);

  if (items && items.length > 0) {
    const rows = items
      .filter(i => i.description)
      .map(i => ({
        quote_id:    req.params.id,
        description: i.description,
        quantity:    Number(i.quantity  || 1),
        unit_price:  Number(i.unit_price|| 0),
        total:       Number(i.quantity  || 1) * Number(i.unit_price || 0),
      }));
    if (rows.length > 0) {
      const { error: iErr } = await supabase.from('quote_items').insert(rows);
      if (iErr) console.error('Items update error:', iErr.message);
    }
  }

  res.json({ quote });
});

router.delete('/:id', async (req, res) => {
  await supabase.from('quote_items').delete().eq('quote_id', req.params.id);
  const { error } = await supabase.from('job_quotes').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;