import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { logAdminActivity } from '@/lib/auth';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  
  const [registrations, settings, stats] = await Promise.all([
    db.execute('SELECT * FROM registrations ORDER BY registered_at ASC'),
    db.execute('SELECT * FROM event_settings WHERE id = 1'),
    Promise.all([
      db.execute("SELECT COUNT(*) as count FROM registrations WHERE registration_status='confirmed'"),
      db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type='link_click'"),
      db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type='page_view'"),
    ]),
  ]);

  const eventSettings = settings.rows[0];
  
  // Gather all custom field keys
  const customFieldKeys = new Set<string>();
  for (const reg of registrations.rows) {
    try {
      const fields = JSON.parse(String(reg.additional_fields_json || '{}'));
      Object.keys(fields).forEach(k => customFieldKeys.add(k));
    } catch {}
  }
  const customKeys = Array.from(customFieldKeys);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GDG UPES Platform';
  workbook.created = new Date();

  // Sheet 1: Registrations
  const sheet1 = workbook.addWorksheet('Student Registrations');
  
  const baseHeaders = [
    { header: 'S.No.', key: 'sno', width: 8 },
    { header: 'Registration Number', key: 'reg_num', width: 20 },
    { header: 'Full Name', key: 'name', width: 25 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'SAP ID', key: 'sap', width: 15 },
    { header: 'Department', key: 'dept', width: 20 },
    { header: 'Specialization', key: 'spec', width: 25 },
    { header: 'Academic Year', key: 'year', width: 15 },
    { header: 'Semester', key: 'sem', width: 12 },
    { header: 'Phone Number', key: 'phone', width: 16 },
    { header: 'Registration Status', key: 'status', width: 20 },
    { header: 'Registration Date', key: 'reg_date', width: 15 },
    { header: 'Registration Time', key: 'reg_time', width: 15 },
    ...customKeys.map(k => ({ header: k, key: k, width: 20 })),
  ];
  
  sheet1.columns = baseHeaders;

  // Style header row
  const headerRow = sheet1.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF21172E' } };
  headerRow.height = 20;
  sheet1.views = [{ state: 'frozen', ySplit: 1 }];
  sheet1.autoFilter = { from: 'A1', to: { row: 1, column: baseHeaders.length } };

  for (let i = 0; i < registrations.rows.length; i++) {
    const reg = registrations.rows[i];
    const dt = new Date(String(reg.registered_at));
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(dt.getTime() + istOffset);
    
    let customFields: Record<string, unknown> = {};
    try { customFields = JSON.parse(String(reg.additional_fields_json || '{}')); } catch {}

    const row: Record<string, unknown> = {
      sno: i + 1,
      reg_num: reg.registration_number,
      name: reg.full_name,
      email: reg.email,
      sap: reg.sap_id,
      dept: reg.department || '',
      spec: reg.specialization || '',
      year: reg.year || '',
      sem: reg.semester || '',
      phone: reg.phone_number || '',
      status: reg.registration_status,
      reg_date: ist.toLocaleDateString('en-IN'),
      reg_time: ist.toLocaleTimeString('en-IN'),
    };
    
    for (const k of customKeys) {
      row[k] = customFields[k] ?? '';
    }
    
    sheet1.addRow(row);
  }

  // Sheet 2: Event Summary
  const sheet2 = workbook.addWorksheet('Event Summary');
  sheet2.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 50 },
  ];
  const summaryHeaderRow = sheet2.getRow(1);
  summaryHeaderRow.font = { bold: true };
  
  const summaryData = [
    ['Event Name', String(eventSettings?.event_name || '')],
    ['University', String(eventSettings?.university_name || '')],
    ['Campus', String(eventSettings?.campus_name || '')],
    ['Event Date', String(eventSettings?.event_date || '')],
    ['Event Venue', String(eventSettings?.event_venue || '')],
    ['Total Registrations', String(Number(stats[0].rows[0]?.count || 0))],
    ['Total Link Clicks', String(Number(stats[1].rows[0]?.count || 0))],
    ['Total Page Visits', String(Number(stats[2].rows[0]?.count || 0))],
    ['Export Generated (IST)', new Date(Date.now() + 5.5 * 60 * 60 * 1000).toLocaleString('en-IN')],
  ];
  
  for (const [field, value] of summaryData) {
    sheet2.addRow({ field, value });
  }

  await logAdminActivity('excel_export', `Excel export generated with ${registrations.rows.length} registrations`);

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split('T')[0];
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GDG_UPES_Registrations_${date}.xlsx"`,
    },
  });
}
