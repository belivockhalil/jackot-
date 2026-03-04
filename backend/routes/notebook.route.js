const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase.from('notebook').select('*, projects(name)').eq('user_id', userId).order('date', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ notes: data });
});

router.post('/', async (req, res) => {
  const { userId, type, content, tags, project_id } = req.body;
  const { data, error } = await supabase.from('notebook').insert([{ user_id: userId, type, content, tags: tags || [], project_id: project_id || null, date: new Date().toISOString() }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ note: data });
});

router.put('/:id', async (req, res) => {
  const { type, content, tags, project_id } = req.body;
  const { data, error } = await supabase.from('notebook').update({ type, content, tags: tags || [], project_id: project_id || null }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ note: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('notebook').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;