'use client';

/**
 * RecordPreviewModal — read-only view of an entity record. Renders each
 * visible field as a label/value row. File and external URL values render
 * as clickable "Open file" links that go through FileViewerModal so
 * preview-in-place still works.
 *
 * Bind-mounted alongside other shared components.
 */

import React, { useEffect, useState } from 'react';
import FileViewerModal from './FileViewerModal';
import AiAssist from './AiAssist';
import DynamicEntityForm from './DynamicEntityForm';
import { ensureVaultLockInstalled } from './vaultLock';

interface FieldDef {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_visible: boolean;
  is_sensitive?: boolean;
  picklist_values?: any;
}

interface RecordPreviewModalProps {
  record: any;
  fields: FieldDef[];
  // The entity_type being previewed — used to decide whether to expose
  // the inline "copy" affordance on each value. Only the credentials
  // vault needs it; everywhere else the chrome is cleaner without it.
  entityType?: string;
  // Module code (path segment) for AI gating; enables the per-record AI button.
  module?: string;
  // Friendly section name for section-aware AI copy.
  sectionLabel?: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const isLinkValue = (v: any): v is string =>
  typeof v === 'string' && (v.startsWith('/uploads/') || v.startsWith('http://') || v.startsWith('https://'));

function valueOf(rec: any, fieldName: string) {
  return rec?.[fieldName] ?? rec?.data?.[fieldName];
}

function SensitiveValue({ value, multiline }: { value: any; multiline?: boolean }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    ensureVaultLockInstalled();
    const onLock = () => setShow(false);
    window.addEventListener('vault-lock', onLock);
    return () => window.removeEventListener('vault-lock', onLock);
  }, []);
  if (!value) return <>—</>;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  if (multiline) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-1">
          <button type="button" onClick={() => setShow(v => !v)} className="text-xs underline">
            {show ? 'hide' : 'show'}
          </button>
          <button type="button" onClick={handleCopy} className="text-xs underline">
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        {show ? (
          <pre className="text-xs whitespace-pre-wrap break-all p-3 border bg-white"
               style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', maxHeight: '14rem', overflow: 'auto' }}>
            {String(value)}
          </pre>
        ) : (
          <span className="font-mono">•••••••• ({String(value).length} chars)</span>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-3">
      <span className="font-mono">{show ? String(value) : '••••••••'}</span>
      <button type="button" onClick={() => setShow(v => !v)} className="text-xs underline">
        {show ? 'hide' : 'show'}
      </button>
      <button type="button" onClick={handleCopy} className="text-xs underline">
        {copied ? 'copied' : 'copy'}
      </button>
    </span>
  );
}

function formatValue(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// ---------------------------------------------------------------------------
// Printable document builders. These produce raw HTML strings injected into a
// fresh print window, branded with the tenant's company profile.
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', PKR: '₨', INR: '₹', AED: 'د.إ', SAR: '﷼',
  CAD: 'C$', AUD: 'A$', JPY: '¥', CNY: '¥',
};

function money(n: any, code: string): string {
  const num = typeof n === 'number' ? n : parseFloat(n);
  if (!isFinite(num)) return '—';
  const sym = CURRENCY_SYMBOLS[code] || '';
  const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sym ? `${sym}${formatted}` : `${formatted} ${code}`;
}

// The branded letterhead shown at the top of every printed document.
function companyHeaderHtml(company: any, esc: (s: any) => string): string {
  if (!company) return '';
  const addr = [company.street, [company.city, company.state, company.postal_code].filter(Boolean).join(', '), company.country]
    .filter(Boolean).map((l: string) => esc(l)).join('<br/>');
  const contact = [
    company.primary_contact_phone && `Tel: ${esc(company.primary_contact_phone)}`,
    company.primary_contact_email && esc(company.primary_contact_email),
    company.website && esc(company.website),
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');
  const logo = company.logo_url
    ? `<img src="${company.logo_url}" alt="" style="max-height:56px;max-width:200px;object-fit:contain"/>`
    : `<div style="font-size:20px;font-weight:bold;color:#5147e6">${esc(company.org_name || '')}</div>`;
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
      <div>
        ${logo}
        ${company.logo_url && company.org_name ? `<div style="margin-top:6px;font-size:15px;font-weight:bold;color:#5147e6">${esc(company.org_name)}</div>` : ''}
        ${company.legal_name && company.legal_name !== company.org_name ? `<div style="color:#6b7280">${esc(company.legal_name)}</div>` : ''}
        ${addr ? `<div style="margin-top:6px;color:#4b5563;line-height:1.5">${addr}</div>` : ''}
        ${contact ? `<div style="margin-top:6px;color:#6b7280;font-size:11px">${contact}</div>` : ''}
      </div>
      <div style="text-align:right;color:#6b7280;font-size:11px">
        ${company.tax_id ? `<div>Tax / VAT: ${esc(company.tax_id)}</div>` : ''}
        ${company.registration_number ? `<div>Reg. No: ${esc(company.registration_number)}</div>` : ''}
      </div>
    </div>`;
}

// The footer note + legal IDs printed at the bottom of every document.
function companyFooterHtml(company: any, esc: (s: any) => string): string {
  if (!company) return '';
  const bits = [
    company.footer_note && esc(company.footer_note),
    company.tax_id && `Tax / VAT: ${esc(company.tax_id)}`,
    company.registration_number && `Reg. No: ${esc(company.registration_number)}`,
  ].filter(Boolean);
  if (!bits.length) return '';
  return `<div style="margin-top:36px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:10.5px;text-align:center;line-height:1.6">
    ${bits.join('<br/>')}
  </div>`;
}

// A full invoice document: letterhead + meta, bill-to, line items, totals.
function invoiceDocHtml(record: any, company: any, esc: (s: any) => string): string {
  const g = (k: string) => valueOf(record, k);
  const code = (company && company.currency_code) || 'USD';
  const items: any[] = Array.isArray(g('line_items')) ? g('line_items') : [];

  const number = g('invoice_number') || g('name') || g('title') || '';
  const status = g('status') || '';
  const issue = g('issue_date') || g('invoice_date') || g('date') || '';
  const due = g('due_date') || '';
  const customer = g('customer_name') || g('customer') || g('account_name') || g('bill_to') || '';

  // Compute totals defensively — prefer stored values, else derive from lines.
  const lineSub = items.reduce((s, it) => s + (Number(it.line_subtotal) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) || 0), 0);
  const subtotal = g('subtotal') != null ? Number(g('subtotal')) : lineSub;
  const discount = g('discount') != null ? Number(g('discount')) : items.reduce((s, it) => s + (Number(it.line_discount) || 0), 0);
  const tax = g('tax') != null ? Number(g('tax')) : (g('tax_amount') != null ? Number(g('tax_amount')) : items.reduce((s, it) => s + (Number(it.line_tax) || 0), 0));
  const total = g('total') != null ? Number(g('total')) : (g('total_amount') != null ? Number(g('total_amount')) : subtotal - discount + tax);
  const paid = g('amount_paid') != null ? Number(g('amount_paid')) : null;
  const due_amt = g('amount_due') != null ? Number(g('amount_due')) : (paid != null ? total - paid : null);

  const rows = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const lineTotal = it.line_total != null ? Number(it.line_total) : qty * price;
    const desc = [it.name, it.sku && `(${it.sku})`].filter(Boolean).join(' ');
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eef2f7">${esc(desc || '—')}</td>
      <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right">${qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right">${money(price, code)}</td>
      <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right">${it.discount_pct ? esc(it.discount_pct) + '%' : '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right">${it.tax_rate ? esc(it.tax_rate) + '%' : '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right;font-weight:600">${money(lineTotal, code)}</td>
    </tr>`;
  }).join('');

  const totalRow = (label: string, val: any, strong = false) =>
    `<tr><td style="padding:4px 8px;text-align:right;color:#6b7280">${esc(label)}</td>
     <td style="padding:4px 8px;text-align:right;width:120px;${strong ? 'font-weight:bold;font-size:14px;color:#5147e6;border-top:2px solid #5147e6' : ''}">${money(val, code)}</td></tr>`;

  return `
    ${companyHeaderHtml(company, esc)}
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px">
      <div>
        <div style="font-size:26px;font-weight:bold;letter-spacing:0.04em;color:#5147e6">INVOICE</div>
        ${number ? `<div style="margin-top:2px;color:#4b5563">#${esc(number)}</div>` : ''}
      </div>
      <table style="font-size:11px;color:#4b5563">
        ${issue ? `<tr><td style="padding:1px 8px;color:#9ca3af">Issue date</td><td style="padding:1px 0;text-align:right">${esc(issue)}</td></tr>` : ''}
        ${due ? `<tr><td style="padding:1px 8px;color:#9ca3af">Due date</td><td style="padding:1px 0;text-align:right">${esc(due)}</td></tr>` : ''}
        ${status ? `<tr><td style="padding:1px 8px;color:#9ca3af">Status</td><td style="padding:1px 0;text-align:right;font-weight:bold;color:#5147e6">${esc(status)}</td></tr>` : ''}
      </table>
    </div>

    ${customer ? `<div style="margin-top:20px">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:4px">Bill to</div>
      <div style="font-weight:bold;color:#1f2937">${esc(customer)}</div>
    </div>` : ''}

    <table style="width:100%;margin-top:20px;font-size:12px">
      <thead>
        <tr style="background:#f8fafc;color:#5147e6">
          <th style="padding:8px;text-align:left;border-bottom:2px solid #5147e6">Description</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #5147e6">Qty</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #5147e6">Unit Price</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #5147e6">Disc.</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #5147e6">Tax</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #5147e6">Amount</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="6" style="padding:12px;color:#9ca3af;text-align:center">No line items</td></tr>`}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:14px">
      <table style="font-size:12px">
        ${totalRow('Subtotal', subtotal)}
        ${discount ? totalRow('Discount', -Math.abs(discount)) : ''}
        ${tax ? totalRow('Tax', tax) : ''}
        ${totalRow('Total', total, true)}
        ${paid != null ? totalRow('Amount paid', paid) : ''}
        ${due_amt != null ? totalRow('Amount due', due_amt, true) : ''}
      </table>
    </div>

    ${companyFooterHtml(company, esc)}
  `;
}

// The generic record document — branded header + field list + footer.
function genericDocHtml(
  groupedFields: Array<[string, FieldDef[]]>,
  record: any,
  company: any,
  title: string,
  esc: (s: any) => string,
): string {
  const sections = groupedFields.map(([groupName, groupFields]) => {
    const rows = groupFields.map((f) => {
      const v = valueOf(record, f.field_name);
      const display = (v === null || v === undefined || v === '') ? '—' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
      return `<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#6b7280;width:12rem">${esc(f.field_label)}</td><td style="padding:4px 8px;border:1px solid #e5e7eb">${esc(display)}</td></tr>`;
    }).join('');
    return `${groupName ? `<h3 style="margin:14px 0 6px;font-size:11px;letter-spacing:0.08em;color:#5147e6;border-bottom:1px solid #5147e6;padding-bottom:2px">${esc(groupName).toUpperCase()}</h3>` : ''}<table style="width:100%;border-collapse:collapse;font-size:12px">${rows}</table>`;
  }).join('');
  const header = companyHeaderHtml(company, esc);
  return `
    ${header}
    <h1 style="margin:${header ? '24px' : '0'} 0 16px;font-size:18px;color:#5147e6">${esc(title)}</h1>
    ${sections}
    ${companyFooterHtml(company, esc)}
  `;
}

// Load a data-URL/URL image to learn its natural aspect ratio (for the PDF logo).
function loadImageSize(src: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      img.onerror = () => resolve(null);
      img.src = src;
    } catch { resolve(null); }
  });
}

// Build and download a real PDF invoice using jsPDF primitives (no html2canvas).
// Drawn in millimetres on A4, branded with the company profile.
async function downloadInvoicePdf(record: any, company: any) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, M = 16;
  const navy: [number, number, number] = [60, 59, 110];
  const gray: [number, number, number] = [107, 114, 128];
  const dark: [number, number, number] = [31, 41, 55];
  const g = (k: string) => valueOf(record, k);
  const code = (company && company.currency_code) || 'USD';
  const items: any[] = Array.isArray(g('line_items')) ? g('line_items') : [];
  let y = M;

  // ---- Letterhead -------------------------------------------------------
  const co = company || {};
  if (co.logo_url && /^data:image\//.test(co.logo_url)) {
    const size = await loadImageSize(co.logo_url);
    if (size) {
      const maxW = 42, maxH = 18;
      const scale = Math.min(maxW / size.w, maxH / size.h);
      const w = size.w * scale, h = size.h * scale;
      const fmt = /^data:image\/png/i.test(co.logo_url) ? 'PNG' : 'JPEG';
      try { doc.addImage(co.logo_url, fmt, M, y, w, h); } catch { /* skip bad image */ }
      y += h + 3;
    }
  }
  doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...navy);
  doc.text(String(co.org_name || ''), M, y + 2);
  y += 6;
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...gray);
  const headerLines = [
    co.legal_name && co.legal_name !== co.org_name ? co.legal_name : '',
    co.street || '',
    [co.city, co.state, co.postal_code].filter(Boolean).join(', '),
    co.country || '',
    [co.primary_contact_phone && `Tel: ${co.primary_contact_phone}`, co.primary_contact_email, co.website].filter(Boolean).join('  ·  '),
  ].filter(Boolean);
  headerLines.forEach((l) => { doc.text(String(l), M, y); y += 4.2; });

  // Tax / reg on the right of the letterhead
  doc.setFontSize(8.5).setTextColor(...gray);
  let ry = M;
  if (co.tax_id) { doc.text(`Tax / VAT: ${co.tax_id}`, PW - M, ry, { align: 'right' }); ry += 4; }
  if (co.registration_number) { doc.text(`Reg. No: ${co.registration_number}`, PW - M, ry, { align: 'right' }); ry += 4; }

  // ---- INVOICE title + meta --------------------------------------------
  y = Math.max(y, ry) + 6;
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(...navy);
  doc.text('INVOICE', M, y);
  const number = g('invoice_number') || g('name') || g('title') || '';
  if (number) { doc.setFontSize(11).setTextColor(...gray).setFont('helvetica', 'normal'); doc.text(`#${number}`, M, y + 6); }

  const issue = g('issue_date') || g('invoice_date') || g('date') || '';
  const due = g('due_date') || '';
  const status = g('status') || '';
  doc.setFontSize(9);
  let my = y - 4;
  const metaRow = (label: string, val: string) => {
    doc.setTextColor(...gray); doc.text(label, PW - M - 34, my, { align: 'left' });
    doc.setTextColor(...dark); doc.text(String(val), PW - M, my, { align: 'right' }); my += 4.6;
  };
  if (issue) metaRow('Issue date', issue);
  if (due) metaRow('Due date', due);
  if (status) metaRow('Status', status);
  y += 12;

  // ---- Bill to ----------------------------------------------------------
  const customer = g('customer_name') || g('customer') || g('account_name') || g('bill_to') || '';
  if (customer) {
    doc.setFontSize(8).setTextColor(...gray); doc.text('BILL TO', M, y);
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...dark); doc.text(String(customer), M, y + 5);
    doc.setFont('helvetica', 'normal');
    y += 12;
  }

  // ---- Line items table -------------------------------------------------
  const cols = [
    { x: M, w: 78, align: 'left' as const, label: 'Description' },
    { x: M + 84, w: 14, align: 'right' as const, label: 'Qty' },
    { x: M + 110, w: 22, align: 'right' as const, label: 'Unit' },
    { x: M + 132, w: 16, align: 'right' as const, label: 'Disc' },
    { x: M + 150, w: 14, align: 'right' as const, label: 'Tax' },
    { x: PW - M, w: 24, align: 'right' as const, label: 'Amount' },
  ];
  const drawHeader = () => {
    doc.setFillColor(248, 250, 252); doc.rect(M, y, PW - 2 * M, 7, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...navy);
    cols.forEach((c) => doc.text(c.label, c.align === 'right' ? c.x : c.x, y + 4.8, { align: c.align }));
    doc.setDrawColor(...navy).setLineWidth(0.4); doc.line(M, y + 7, PW - M, y + 7);
    y += 10;
  };
  drawHeader();
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...dark);

  const moneyP = (n: any) => money(n, code).replace(/ /g, ' ');
  let lineSub = 0, lineDisc = 0, lineTax = 0;
  items.forEach((it) => {
    if (y > 262) { doc.addPage(); y = M; drawHeader(); doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...dark); }
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const sub = it.line_subtotal != null ? Number(it.line_subtotal) : qty * price;
    const lt = it.line_total != null ? Number(it.line_total) : sub;
    lineSub += sub; lineDisc += Number(it.line_discount) || 0; lineTax += Number(it.line_tax) || 0;
    const desc = [it.name, it.sku ? `(${it.sku})` : ''].filter(Boolean).join(' ');
    const descLines = doc.splitTextToSize(String(desc || '—'), cols[0].w);
    doc.text(descLines, cols[0].x, y);
    doc.text(String(qty), cols[1].x, y, { align: 'right' });
    doc.text(moneyP(price), cols[2].x, y, { align: 'right' });
    doc.text(it.discount_pct ? `${it.discount_pct}%` : '—', cols[3].x, y, { align: 'right' });
    doc.text(it.tax_rate ? `${it.tax_rate}%` : '—', cols[4].x, y, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.text(moneyP(lt), cols[5].x, y, { align: 'right' }); doc.setFont('helvetica', 'normal');
    const rowH = Math.max(6, descLines.length * 4.6);
    y += rowH;
    doc.setDrawColor(238, 242, 247).setLineWidth(0.2); doc.line(M, y - 1.5, PW - M, y - 1.5);
  });
  if (!items.length) { doc.setTextColor(...gray); doc.text('No line items', PW / 2, y + 2, { align: 'center' }); y += 8; }

  // ---- Totals -----------------------------------------------------------
  const subtotal = g('subtotal') != null ? Number(g('subtotal')) : lineSub;
  const discount = g('discount') != null ? Number(g('discount')) : lineDisc;
  const tax = g('tax') != null ? Number(g('tax')) : (g('tax_amount') != null ? Number(g('tax_amount')) : lineTax);
  const total = g('total') != null ? Number(g('total')) : (g('total_amount') != null ? Number(g('total_amount')) : subtotal - discount + tax);
  const paid = g('amount_paid') != null ? Number(g('amount_paid')) : null;
  const dueAmt = g('amount_due') != null ? Number(g('amount_due')) : (paid != null ? total - paid : null);

  y += 4;
  const tlx = PW - M - 60;
  const totalLine = (label: string, val: number, strong = false) => {
    if (strong) { doc.setDrawColor(...navy).setLineWidth(0.4); doc.line(tlx, y - 3, PW - M, y - 3); }
    doc.setFont('helvetica', strong ? 'bold' : 'normal').setFontSize(strong ? 11 : 9).setTextColor(...(strong ? navy : gray));
    doc.text(label, tlx, y, { align: 'left' });
    doc.setTextColor(...(strong ? navy : dark));
    doc.text(moneyP(val), PW - M, y, { align: 'right' });
    y += strong ? 6.5 : 5;
  };
  totalLine('Subtotal', subtotal);
  if (discount) totalLine('Discount', -Math.abs(discount));
  if (tax) totalLine('Tax', tax);
  totalLine('Total', total, true);
  if (paid != null) totalLine('Amount paid', paid);
  if (dueAmt != null) totalLine('Amount due', dueAmt, true);

  // ---- Footer -----------------------------------------------------------
  const footBits = [co.footer_note, co.tax_id && `Tax / VAT: ${co.tax_id}`, co.registration_number && `Reg. No: ${co.registration_number}`].filter(Boolean);
  if (footBits.length) {
    doc.setDrawColor(229, 231, 235).setLineWidth(0.2); doc.line(M, 282, PW - M, 282);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...gray);
    let fy = 286;
    footBits.forEach((b) => { doc.text(String(b), PW / 2, fy, { align: 'center' }); fy += 3.6; });
  }

  const fname = `Invoice-${String(number || 'document').replace(/[^\w.-]+/g, '_')}.pdf`;
  doc.save(fname);
}

// Inline copy button used next to every non-empty value.
function CopyChip({ value }: { value: any }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <button type="button" onClick={handleCopy} className="text-xs underline ml-2">
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

export default function RecordPreviewModal({
  record,
  fields,
  entityType,
  module,
  sectionLabel,
  onClose,
  onEdit,
  onDelete,
}: RecordPreviewModalProps) {
  const [openFileUrl, setOpenFileUrl] = useState<string | null>(null);
  const [sharedFlash, setSharedFlash] = useState(false);
  const [editing, setEditing] = useState(false);
  const showCopy = entityType === 'credentials';

  // The tenant's branding, for printed documents (invoices etc.). Loaded once.
  const [company, setCompany] = useState<any | null>(null);
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const h: Record<string, string> = {};
    if (t) h['Authorization'] = `Bearer ${t}`;
    fetch('/api/v1/company/profile', { headers: h })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCompany(d))
      .catch(() => { /* print falls back to no branding */ });
  }, []);

  // Deep-link to this specific record using the current URL with /{id}
  // appended if not already a detail route. Falls back to clipboard.
  const handleShare = async () => {
    if (typeof window === 'undefined' || !record?.id) return;
    const base = window.location.origin + window.location.pathname;
    const url = base.endsWith('/' + record.id) ? base : `${base.replace(/\/+$/, '')}/${record.id}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: 'Record', url }); return; }
      catch { /* user cancelled — fall through to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setSharedFlash(true);
      setTimeout(() => setSharedFlash(false), 1500);
    } catch { window.prompt('Copy link:', url); }
  };

  // Print: open a print-friendly window, branded with the company profile.
  // Invoices get a proper invoice document (header, bill-to, line items,
  // totals); every other record gets the generic field list under the same
  // branded company header + footer.
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (s: any) => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
    const isInvoice = /invoice/i.test(entityType || '');
    const body = isInvoice ? invoiceDocHtml(record, company, esc) : genericDocHtml(groupedFields, record, company, title, esc);
    w.document.write(`<!doctype html><html><head><title>${esc(title)}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:0;padding:36px;font-size:12px}
        h1{margin:0;font-size:18px;color:#5147e6}
        table{border-collapse:collapse}
        .doc{max-width:760px;margin:0 auto}
        @media print{body{padding:0}}
      </style>
    </head><body><div class="doc">
      ${body}
      <script>window.onload=function(){setTimeout(function(){window.print();},200);}</script>
    </div></body></html>`);
    w.document.close();
  };

  const isInvoice = /invoice/i.test(entityType || '');
  const [pdfBusy, setPdfBusy] = useState(false);
  const handleDownloadPdf = async () => {
    setPdfBusy(true);
    try { await downloadInvoicePdf(record, company); }
    catch { if (typeof window !== 'undefined') window.alert('Could not generate the PDF.'); }
    finally { setPdfBusy(false); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sortedFields = [...fields]
    .filter(f => f.is_visible !== false)
    .sort((a, b) => a.display_order - b.display_order);

  // Use a title field if present.
  const titleField = sortedFields.find(f => ['title', 'name'].includes(f.field_name));
  const title = titleField ? formatValue(valueOf(record, titleField.field_name)) : 'Record';

  // Group fields by their `field_group` (kept in declared order). Fields
  // without a group fall under a single un-named bucket rendered last.
  const groupedFields: Array<[string, FieldDef[]]> = (() => {
    const map = new Map<string, FieldDef[]>();
    const ungrouped: FieldDef[] = [];
    for (const f of sortedFields) {
      const g = ((f as any).field_group || '').trim();
      if (!g) { ungrouped.push(f); continue; }
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(f);
    }
    const out: Array<[string, FieldDef[]]> = Array.from(map.entries());
    if (ungrouped.length > 0) out.push(['', ungrouped]);
    return out;
  })();

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', padding: '3rem 1rem' }}
        onClick={onClose}
      >
        <div
          className="bg-white flex flex-col"
          style={{
            width: '100%',
            maxWidth: '40rem',
            maxHeight: 'calc(100vh - 6rem)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — navy accent title + flat action buttons */}
          <div
            className="flex items-center justify-between gap-4 px-5 py-3 shrink-0"
            style={{ borderBottom: '1px solid #e5e7eb' }}
          >
            <h2
              className="text-base font-bold truncate leading-none"
              style={{ color: '#5147e6', letterSpacing: '0.02em' }}
            >
              {title}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              {entityType && <AiAssist module={module || entityType} entityType={entityType} sectionLabel={sectionLabel} record={record} />}
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1.5 text-sm font-semibold"
                style={{ border: '1px solid #5147e6', color: '#5147e6', backgroundColor: '#ffffff' }}
                title="Copy a link to this record"
              >
                {sharedFlash ? 'Link copied' : 'Share'}
              </button>
              {isInvoice && (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfBusy}
                  className="btn-primary px-3 py-1.5 text-sm font-semibold"
                  title="Download this invoice as a PDF"
                >
                  {pdfBusy ? 'Generating…' : 'Download PDF'}
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 text-sm font-semibold"
                style={{ border: '1px solid #5147e6', color: '#5147e6', backgroundColor: '#ffffff' }}
                title="Open a print-friendly view"
              >
                Print
              </button>
              {entityType && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-sm font-semibold"
                  style={{ border: '1px solid #5147e6', color: '#5147e6', backgroundColor: '#ffffff' }}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-3 py-1.5 text-sm font-semibold"
                  style={{ border: '1px solid #b91c1c', color: '#b91c1c', backgroundColor: '#ffffff' }}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex items-center justify-center"
                style={{ width: '28px', height: '28px', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Body — fields grouped by their `field_group` (when set). Each
              group renders a thin uppercase header followed by a two-col
              `label : value` table. Labels and values are the same text
              size so the left column doesn't visually dominate. */}
          <div className="flex-1 min-h-0 overflow-auto px-5 py-3">
            {editing ? (
              <DynamicEntityForm
                entityType={entityType || ''}
                entityId={record?.id}
                onSave={() => { setEditing(false); if (typeof window !== 'undefined') window.location.reload(); }}
                onCancel={() => setEditing(false)}
              />
            ) : groupedFields.map(([groupName, groupFields]) => (
              <section key={groupName || '_default'} className="mb-4">
                {groupName && (
                  <div
                    className="text-[10px] uppercase mb-1.5 pt-1"
                    style={{
                      color: '#5147e6',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid #5147e6',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    {groupName}
                  </div>
                )}
                <dl
                  className="grid gap-x-4"
                  style={{ gridTemplateColumns: '11rem 1fr' }}
                >
                  {groupFields.map(f => {
                    const v = valueOf(record, f.field_name);
                    const isEmpty = v === null || v === undefined || v === '';
                    const isFileField = f.field_type === 'file' || f.field_type === 'image' || isLinkValue(v);
                    const isPasswordType = f.field_type === 'password' || f.field_type === 'secret';
                    const isSensitive = !!f.is_sensitive || isPasswordType;
                    const isTextarea = f.field_type === 'textarea';
                    const isLongValue = typeof v === 'string' && v.length > 80;
                    if (titleField && f.field_name === titleField.field_name) return null;
                    return (
                      <React.Fragment key={f.id}>
                        <dt
                          className="py-1.5 text-xs"
                          style={{
                            color: '#6b7280',
                            fontWeight: 500,
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          {f.field_label}
                          {isSensitive && <span className="ml-1.5" style={{ color: '#b45309' }}>🔒</span>}
                        </dt>
                        <dd
                          className={`py-1.5 text-xs break-words ${isEmpty ? 'opacity-50' : ''}`}
                          style={{ color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}
                        >
                          {isEmpty ? (
                            '—'
                          ) : isSensitive ? (
                            <SensitiveValue value={v} multiline={isTextarea || isLongValue} />
                          ) : isFileField && isLinkValue(v) ? (
                            <span className="inline-flex items-center">
                              <button
                                type="button"
                                onClick={() => setOpenFileUrl(v)}
                                className="underline"
                                style={{ color: '#5147e6' }}
                              >
                                {v.startsWith('/uploads/') ? 'Open file' : 'Open link'}
                              </button>
                              {showCopy && <CopyChip value={v} />}
                            </span>
                          ) : isTextarea ? (
                            <div>
                              <pre className="whitespace-pre-wrap text-xs" style={{ fontFamily: 'inherit', margin: 0 }}>
                                {formatValue(v)}
                              </pre>
                              {showCopy && <CopyChip value={v} />}
                            </div>
                          ) : (
                            <span className="inline-flex items-center">
                              <span>{formatValue(v)}</span>
                              {showCopy && <CopyChip value={v} />}
                            </span>
                          )}
                        </dd>
                      </React.Fragment>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </div>

      {openFileUrl && (
        <FileViewerModal url={openFileUrl} onClose={() => setOpenFileUrl(null)} />
      )}
    </>
  );
}
