const express  = require('express');
const router   = express.Router();
const { spawn } = require('child_process');
const path     = require('path');
const fs       = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

router.get('/export', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const [
      clientsRes, suppliersRes, projectsRes,
      incomeRes, expensesRes, bankingRes,
      ledgerRes, loansRes, savingsRes, assetsRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', userId),
      supabase.from('suppliers').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('income_entries').select('*, clients(name), projects(name)').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('expense_entries').select('*, suppliers(name), projects(name)').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('bank_accounts').select('*').eq('user_id', userId).eq('is_active', true),
      supabase.from('bank_ledger').select('*, bank_accounts(name)').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('loans').select('*').eq('user_id', userId),
      supabase.from('savings').select('*').eq('user_id', userId),
      supabase.from('assets').select('*').eq('user_id', userId),
      supabase.from('settings').select('*').eq('user_id', userId).single(),
    ]);

    const clients   = clientsRes.data   || [];
    const suppliers = suppliersRes.data || [];
    const projects  = projectsRes.data  || [];
    const income    = incomeRes.data    || [];
    const expenses  = expensesRes.data  || [];
    const banking   = bankingRes.data   || [];
    const ledgerRaw = ledgerRes.data    || [];
    const loans     = loansRes.data     || [];
    const savings   = savingsRes.data   || [];
    const assets    = assetsRes.data    || [];
    const settings  = settingsRes.data  || {};

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      const yr    = new Date().getFullYear();
      const inc   = income.filter(e  => e.date?.startsWith(`${yr}-${month}`)).reduce((s, e) => s + Number(e.amount || 0), 0);
      const exp   = expenses.filter(e => e.date?.startsWith(`${yr}-${month}`)).reduce((s, e) => s + Number(e.amount || 0), 0);
      return { income: inc, expenses: exp };
    });

    const totalIncome    = income.reduce((s, e)    => s + Number(e.amount || 0), 0);
    const totalExpenses  = expenses.reduce((s, e)  => s + Number(e.amount || 0), 0);
    const totalDebtors   = clients.reduce((s, c)   => s + Math.max(0, Number(c.total_billed || 0) - Number(c.total_paid || 0)), 0);
    const totalCreditors = suppliers.reduce((s, c) => s + Math.max(0, Number(c.total_owed || 0) - Number(c.total_paid || 0)), 0);

    const bankingWithTotals = banking.map(acc => {
      const txns    = ledgerRaw.filter(l => l.bank_account_id === acc.id);
      const totalIn  = txns.reduce((s, t) => s + Number(t.amount_in  || 0), 0);
      const totalOut = txns.reduce((s, t) => s + Number(t.amount_out || 0), 0);
      return { ...acc, total_in: totalIn, total_out: totalOut, balance: totalIn - totalOut };
    });

    const payload = {
      biz:  settings.business_name || 'My Business',
      date: new Date().toLocaleDateString('en-GB'),
      summary: {
        totalIncome, totalExpenses,
        grossProfit:   totalIncome - totalExpenses,
        totalDebtors,  totalCreditors,
      },
      monthly,
      clients: clients.map(c => ({
        name: c.name, phone: c.phone||'', email: c.email||'',
        location: c.location||'',
        total_billed: Number(c.total_billed||0),
        total_paid:   Number(c.total_paid||0),
      })),
      suppliers: suppliers.map(s => ({
        name: s.name, phone: s.phone||'', email: s.email||'',
        items_supplied: s.items_supplied||'',
        total_owed:  Number(s.total_owed||0),
        total_paid:  Number(s.total_paid||0),
      })),
      projects: projects.map(p => ({
        name: p.name, status: p.status||'active',
        contract_amount:      Number(p.contract_amount||0),
        amount_paid:          Number(p.amount_paid||0),
        estimated_completion: p.estimated_completion||'',
        product_type: p.product_type||'',
        notes:        p.notes||'',
      })),
      income: income.slice(0,500).map(e => ({
        date:             e.date ? new Date(e.date).toLocaleDateString('en-GB') : '',
        amount:           Number(e.amount||0),
        collection_point: e.collection_point||'',
        reference_code:   e.reference_code||'',
        client:           e.clients?.name||'',
        project:          e.projects?.name||'',
        notes:            e.notes||'',
      })),
      expenses: expenses.slice(0,500).map(e => ({
        date:             e.date ? new Date(e.date).toLocaleDateString('en-GB') : '',
        amount:           Number(e.amount||0),
        type:             e.type||'',
        collection_point: e.collection_point||'',
        reference_code:   e.reference_code||'',
        supplier:         e.suppliers?.name||'',
        project:          e.projects?.name||'',
        notes:            e.notes||'',
      })),
      banking: bankingWithTotals.map(b => ({
        name:      b.name||'',
        type:      b.type||'',
        total_in:  Number(b.total_in||0),
        total_out: Number(b.total_out||0),
        balance:   Number(b.balance||0),
      })),
      ledger: ledgerRaw.slice(0,200).map(l => ({
        account:    l.bank_accounts?.name||'',
        date:       l.date ? new Date(l.date).toLocaleDateString('en-GB') : '',
        description:l.description||'',
        reference:  l.reference_code||'',
        amount_in:  Number(l.amount_in||0),
        amount_out: Number(l.amount_out||0),
        balance:    Number(l.balance||0),
      })),
      loans: loans.map(l => ({
        name:             l.name||l.lender_name||'',
        type:             l.type||'borrowed',
        principal_amount: Number(l.principal_amount||l.amount||0),
        amount_paid:      Number(l.amount_paid||0),
        interest_rate:    Number(l.interest_rate||0),
        due_date:         l.due_date||l.end_date||'',
        status:           l.status||'active',
      })),
      savings: savings.map(s => ({
        name:           s.name||s.goal_name||'',
        target_amount:  Number(s.target_amount||s.goal_amount||0),
        current_amount: Number(s.current_amount||s.saved_amount||0),
        target_date:    s.target_date||s.due_date||'',
        notes:          s.notes||s.description||'',
      })),
      assets: assets.map(a => ({
        name:           a.name||'',
        category:       a.category||a.type||'',
        purchase_value: Number(a.purchase_value||a.cost||a.value||0),
        current_value:  Number(a.current_value||a.book_value||a.purchase_value||a.cost||a.value||0),
        purchase_date:  a.purchase_date||a.date_acquired||'',
        condition:      a.condition||a.status||'good',
        notes:          a.notes||a.description||'',
      })),
    };

    // ── Write temp script with correct output path ────
    const scriptPath = path.join(__dirname, '..', 'build_excel_full.py');
    const outputPath = path.join(__dirname, '..', `export_${Date.now()}.xlsx`);
    const tempScript = path.join(__dirname, '..', `script_${Date.now()}.py`);

    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    // Replace the hardcoded output path with our temp path
    scriptContent = scriptContent.replace(
      /wb\.save\(['"](.*?)['"]\)/,
      `wb.save(r'${outputPath.replace(/\\/g, '\\\\')}')`
    );
    fs.writeFileSync(tempScript, scriptContent);

    // ── Spawn Python ──────────────────────────────────
    const python = spawn('python', [tempScript]);
    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    let stderr = '';
    python.stderr.on('data', d => { stderr += d.toString(); });

    python.on('close', (code) => {
      fs.unlink(tempScript, () => {});

      if (code !== 0) {
        console.error('Python error:', stderr);
        return res.status(500).json({ error: 'Excel generation failed', details: stderr });
      }

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ error: 'Excel file not created' });
      }

      const filename = `${payload.biz.replace(/\s+/g,'-')}-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);
      stream.on('end', () => { fs.unlink(outputPath, () => {}); });
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).json({ error: 'Failed to send file' });
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
