import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';

const db = createClient({ url: 'file:local.db' });

async function runTests() {
  console.log('\n======================================================');
  console.log('  RUNNING COMPREHENSIVE VERIFICATION SUITE');
  console.log('======================================================\n');

  // Test 1: Verify Event Settings
  console.log('[TEST 1] Verifying Event Settings in Database...');
  const settingsRes = await db.execute('SELECT * FROM event_settings WHERE id = 1');
  if (settingsRes.rows.length === 0) throw new Error('Event settings row missing');
  console.log('✓ Event Name:', settingsRes.rows[0].event_name);
  console.log('✓ Status:', settingsRes.rows[0].registration_status);
  console.log('✓ Campus:', settingsRes.rows[0].campus_name);

  // Test 2: Student Registration Simulation
  console.log('\n[TEST 2] Testing Student Registration & Uniqueness...');
  const testSap = '500109999';
  const testEmail = 'test.student@ddn.upes.ac.in';
  
  // Clean existing test user if any
  await db.execute({
    sql: 'DELETE FROM registrations WHERE lower(email) = ? OR lower(sap_id) = ?',
    args: [testEmail.toLowerCase(), testSap.toLowerCase()],
  });

  // Calculate next registration number
  const year = new Date().getFullYear();
  const prefix = `GDG-${year}-`;
  const seqResult = await db.execute({
    sql: `SELECT COALESCE(MAX(CAST(SUBSTR(registration_number, 10) AS INTEGER)), 0) as max_seq FROM registrations WHERE registration_number LIKE ?`,
    args: [`${prefix}%`],
  });
  const nextSeq = Number(seqResult.rows[0]?.max_seq || 0) + 1;
  const regNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO registrations 
      (registration_number, full_name, email, sap_id, department, specialization, year, semester, phone_number, additional_fields_json, registration_status, registered_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
    args: [
      regNumber,
      'Test Student',
      testEmail.toLowerCase(),
      testSap,
      'School of Computer Science',
      'AI & Machine Learning',
      '3rd Year',
      'Semester 5',
      '+91 9876543210',
      JSON.stringify({ "T-Shirt Size": "L", "Dietary Preference": "Vegetarian" }),
      now,
      now,
    ],
  });
  console.log('✓ Registration inserted successfully with Reg No:', regNumber);

  // Test Duplicate Email
  let emailDupCaught = false;
  try {
    await db.execute({
      sql: `INSERT INTO registrations (registration_number, full_name, email, sap_id, registration_status, registered_at, updated_at) VALUES (?, ?, ?, ?, 'confirmed', ?, ?)`,
      args: [`${prefix}9998`, 'Duplicate Email User', testEmail.toUpperCase(), '500111111', now, now],
    });
  } catch (err) {
    emailDupCaught = true;
    console.log('✓ Duplicate Email correctly blocked by database UNIQUE constraint (case-insensitive)');
  }
  if (!emailDupCaught) throw new Error('Duplicate email was not blocked!');

  // Test Duplicate SAP ID
  let sapDupCaught = false;
  try {
    await db.execute({
      sql: `INSERT INTO registrations (registration_number, full_name, email, sap_id, registration_status, registered_at, updated_at) VALUES (?, ?, ?, ?, 'confirmed', ?, ?)`,
      args: [`${prefix}9999`, 'Duplicate SAP User', 'another.student@ddn.upes.ac.in', testSap, now, now],
    });
  } catch (err) {
    sapDupCaught = true;
    console.log('✓ Duplicate SAP ID correctly blocked by database UNIQUE constraint');
  }
  if (!sapDupCaught) throw new Error('Duplicate SAP ID was not blocked!');

  // Test 3: Analytics Events Tracking
  console.log('\n[TEST 3] Testing Analytics Telemetry...');
  await db.execute({
    sql: `INSERT INTO analytics_events (event_type, element_name, element_label, target_url, page_path, anonymous_session_id, created_at)
          VALUES ('page_view', 'registration_portal', 'Public Portal', null, '/', 'test_sid_1', ?)`,
    args: [now],
  });
  await db.execute({
    sql: `INSERT INTO analytics_events (event_type, element_name, element_label, target_url, page_path, anonymous_session_id, created_at)
          VALUES ('link_click', 'register-cta-hero', 'Register Now Button', '#register', '/', 'test_sid_1', ?)`,
    args: [now],
  });
  await db.execute({
    sql: `INSERT INTO analytics_events (event_type, element_name, element_label, target_url, page_path, anonymous_session_id, created_at)
          VALUES ('button_click', 'submit-registration-btn', 'Complete Event Registration', null, '/', 'test_sid_1', ?)`,
    args: [now],
  });

  const analyticsCount = await db.execute(`SELECT event_type, COUNT(*) as count FROM analytics_events GROUP BY event_type`);
  console.log('✓ Analytics recorded event types:');
  for (const row of analyticsCount.rows) {
    console.log(`   - ${row.event_type}: ${row.count} events`);
  }

  // Test 4: Password Verification
  console.log('\n[TEST 4] Testing Password Hashing & Verification...');
  const testPassword = 'Admin@GDG2026!';
  const testHash = await bcrypt.hash(testPassword, 12);
  const isCorrect = await bcrypt.compare(testPassword, testHash);
  const isWrong = await bcrypt.compare('WrongPassword123', testHash);
  if (!isCorrect || isWrong) throw new Error('Password verification logic failure');
  console.log('✓ Administrator password verification (bcrypt) verified: Correct password passes, wrong password rejects.');

  // Test 5: Excel Export Generation
  console.log('\n[TEST 5] Testing ExcelJS Workbook Generation...');
  const allRegistrations = await db.execute('SELECT * FROM registrations');
  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet('Student Registrations');
  sheet1.columns = [
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
  ];

  for (let i = 0; i < allRegistrations.rows.length; i++) {
    const r = allRegistrations.rows[i];
    sheet1.addRow({
      sno: i + 1,
      reg_num: r.registration_number,
      name: r.full_name,
      email: r.email,
      sap: r.sap_id,
      dept: r.department || '',
      spec: r.specialization || '',
      year: r.year || '',
      sem: r.semester || '',
      phone: r.phone_number || '',
      status: r.registration_status,
      reg_date: new Date(r.registered_at).toLocaleDateString('en-IN'),
      reg_time: new Date(r.registered_at).toLocaleTimeString('en-IN'),
    });
  }

  const sheet2 = workbook.addWorksheet('Event Summary');
  sheet2.addRow(['Event Name', String(settingsRes.rows[0].event_name)]);
  sheet2.addRow(['Total Registrations', allRegistrations.rows.length]);
  sheet2.addRow(['Generated At', new Date().toISOString()]);

  const buffer = await workbook.xlsx.writeBuffer();
  console.log(`✓ Excel workbook successfully generated! (${buffer.byteLength} bytes)`);

  console.log('\n======================================================');
  console.log('  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✓');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

