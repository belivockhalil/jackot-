'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [clients,  setClients]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [invoice, setInvoice] = useState({
    clientId: '', projectId: '', invoiceNumber: '', date: new Date().toISOString().split('T')[0],
    dueDate: '', notes: '', items: [{ description:'', quantity:1, unitPrice:'' }]
  });
  const [preview, setPreview] = useState(false);

  const sym = settings?.currency_symbol || 'KSh';
  const prefix = settings?.invoice_prefix || 'INV';

  useEffect(() => { if (!user) return; loadAll(); }, [user]);

  const loadAll = async () => {
    try {
      const [c, p] = await Promise.all([
        api.get(`/clients?userId=${user.userId}`),
        api.get(`/projects?userId=${user.userId}`),
      ]);
      setClients(c.data.clients);
      setProjects(p.data.projects);
      setInvoice(prev => ({ ...prev, invoiceNumber: `${prefix}-${Date.now().toString().slice(-6)}` }));
    } catch { toast.error('Could not load data'); }
    finally { setLoading(false); }
  };

  const addItem = () => setInvoice(p => ({ ...p, items: [...p.items, { description:'', quantity:1, unitPrice:'' }] }));
  const removeItem = (i) => setInvoice(p => ({ ...p, items: p.items.filter((_,idx) => idx !== i) }));
  const updateItem = (i, field, val) => setInvoice(p => ({ ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const subtotal  = invoice.items.reduce((s, item) => s + (Number(item.quantity||0) * Number(item.unitPrice||0)), 0);
  const taxRate   = Number(settings?.tax_rate || 0.16);
  const taxAmount = subtotal * taxRate;
  const total     = subtotal + taxAmount;

  const selectedClient = clients.find(c => c.id === invoice.clientId);

  const downloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const primaryColor = settings?.invoice_color || '#1D4ED8';
    const rgb = hexToRgb(primaryColor);

    // Header background
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(0, 0, 210, 45, 'F');

    // Business name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.business_name || 'My Business', 14, 20);

    // INVOICE label
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 14, 32);

    // Invoice number top right
    doc.setFontSize(11);
    doc.text(`#${invoice.invoiceNumber}`, 196, 20, { align: 'right' });
    doc.text(`Date: ${invoice.date}`, 196, 28, { align: 'right' });
    if (invoice.dueDate) doc.text(`Due: ${invoice.dueDate}`, 196, 36, { align: 'right' });

    // Reset color
    doc.setTextColor(30, 41, 59);

    // Bill To
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, 58);
    doc.setFont('helvetica', 'normal');
    if (selectedClient) {
      doc.text(selectedClient.name, 14, 65);
      if (selectedClient.phone) doc.text(selectedClient.phone, 14, 71);
      if (selectedClient.email) doc.text(selectedClient.email, 14, 77);
      if (selectedClient.location) doc.text(selectedClient.location, 14, 83);
    } else {
      doc.text('No client selected', 14, 65);
    }

    // Business details right side
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', 130, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(settings?.business_name || '', 130, 65);
    if (settings?.business_phone) doc.text(settings.business_phone, 130, 71);
    if (settings?.business_email) doc.text(settings.business_email, 130, 77);
    if (settings?.business_address) doc.text(settings.business_address, 130, 83);

    // Items table
    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: invoice.items.map(item => [
        item.description || '',
        item.quantity || 0,
        `${sym} ${Number(item.unitPrice||0).toLocaleString()}`,
        `${sym} ${(Number(item.quantity||0) * Number(item.unitPrice||0)).toLocaleString()}`,
      ]),
      headStyles:  { fillColor: [rgb.r, rgb.g, rgb.b], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 20 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 } },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text(`${sym} ${subtotal.toLocaleString()}`, 196, finalY, { align: 'right' });

    doc.text(`Tax (${(taxRate*100).toFixed(0)}%):`, 140, finalY + 7);
    doc.text(`${sym} ${taxAmount.toLocaleString()}`, 196, finalY + 7, { align: 'right' });

    // Total box
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(130, finalY + 12, 66, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, finalY + 19);
    doc.text(`${sym} ${total.toLocaleString()}`, 196, finalY + 19, { align: 'right' });

    // Notes
    if (invoice.notes || settings?.invoice_notes) {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Notes:', 14, finalY + 30);
      doc.text(invoice.notes || settings?.invoice_notes || '', 14, finalY + 37);
    }

    // Footer
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Thank you for your business!', 105, 290, { align: 'center' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('Invoice downloaded!');
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1],16), g: parseInt(result[2],16), b: parseInt(result[3],16) } : { r:29, g:78, b:216 };
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor: colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'900px', margin:'0 auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color: colors.dark }}>🧾 Invoice Generator</h1>
            <p style={{ color: colors.muted }}>Create and download professional PDF invoices</p>
          </div>
          <button onClick={downloadPDF} style={btn(colors.primaryGradient)}>⬇ Download PDF</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

          {/* Left — Invoice Details */}
          <div style={{ backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight:'700', marginBottom:'1rem', color: colors.dark }}>Invoice Details</h3>
            <F label="Invoice Number" value={invoice.invoiceNumber} onChange={v=>setInvoice(p=>({...p,invoiceNumber:v}))} />
            <F label="Date"           value={invoice.date}          onChange={v=>setInvoice(p=>({...p,date:v}))} type="date" />
            <F label="Due Date"       value={invoice.dueDate}       onChange={v=>setInvoice(p=>({...p,dueDate:v}))} type="date" />
            <div style={{ marginBottom:'0.75rem' }}>
              <label style={lbl}>Client</label>
              <select value={invoice.clientId} onChange={e=>setInvoice(p=>({...p,clientId:e.target.value}))} style={sel}>
                <option value="">-- Select Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'0.75rem' }}>
              <label style={lbl}>Project (optional)</label>
              <select value={invoice.projectId} onChange={e=>setInvoice(p=>({...p,projectId:e.target.value}))} style={sel}>
                <option value="">-- None --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <F label="Notes" value={invoice.notes} onChange={v=>setInvoice(p=>({...p,notes:v}))} placeholder="Payment terms, thank you message..." />
          </div>

          {/* Right — Line Items */}
          <div style={{ backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight:'700', marginBottom:'1rem', color: colors.dark }}>Line Items</h3>
            {invoice.items.map((item, i) => (
              <div key={i} style={{ backgroundColor: colors.background, padding:'0.75rem', borderRadius:'0.65rem', marginBottom:'0.75rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.8rem', fontWeight:'600', color: colors.muted }}>Item {i+1}</span>
                  {invoice.items.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background:'none', border:'none', cursor:'pointer', color: colors.danger, fontWeight:'700', fontSize:'0.85rem' }}>✕ Remove</button>
                  )}
                </div>
                <F label="Description" value={item.description} onChange={v=>updateItem(i,'description',v)} placeholder="e.g. Wooden Bed Frame" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                  <F label="Quantity"   value={item.quantity}  onChange={v=>updateItem(i,'quantity',v)}  type="number" />
                  <F label="Unit Price" value={item.unitPrice} onChange={v=>updateItem(i,'unitPrice',v)} type="number" />
                </div>
                <p style={{ textAlign:'right', fontSize:'0.85rem', fontWeight:'700', color: colors.primary }}>
                  = {sym} {(Number(item.quantity||0) * Number(item.unitPrice||0)).toLocaleString()}
                </p>
              </div>
            ))}
            <button onClick={addItem} style={{ width:'100%', padding:'0.6rem', border:`2px dashed ${colors.border}`, borderRadius:'0.6rem', background:'none', cursor:'pointer', color: colors.muted, fontWeight:'600' }}>
              + Add Item
            </button>

            {/* Totals */}
            <div style={{ marginTop:'1rem', borderTop:`1px solid ${colors.divider}`, paddingTop:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                <span style={{ color: colors.muted, fontSize:'0.9rem' }}>Subtotal</span>
                <span style={{ fontWeight:'600' }}>{sym} {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                <span style={{ color: colors.muted, fontSize:'0.9rem' }}>Tax ({(taxRate*100).toFixed(0)}%)</span>
                <span style={{ fontWeight:'600' }}>{sym} {taxAmount.toLocaleString()}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', backgroundColor: colors.primaryLight, padding:'0.75rem', borderRadius:'0.6rem', marginTop:'0.5rem' }}>
                <span style={{ fontWeight:'800', color: colors.primary }}>TOTAL</span>
                <span style={{ fontWeight:'800', color: colors.primary, fontSize:'1.1rem' }}>{sym} {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Banner */}
        <div style={{ marginTop:'1.5rem', backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', textAlign:'center' }}>
          <p style={{ color: colors.muted, marginBottom:'1rem' }}>Ready to download your invoice?</p>
          <button onClick={downloadPDF} style={{ ...btn(colors.primaryGradient), fontSize:'1rem', padding:'0.85rem 2.5rem' }}>
            ⬇ Download Invoice PDF
          </button>
        </div>

      </div>
    </div>
  );
}

const lbl = { display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' };
const sel = { width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid #E2E8F0', borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem' };
const btn = bg => ({ background:bg, color:'white', border:'none', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' });
function F({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div style={{ marginBottom:'0.75rem' }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid #E2E8F0', borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem', boxSizing:'border-box' }} />
    </div>
  );
}