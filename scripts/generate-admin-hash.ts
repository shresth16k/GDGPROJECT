import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('Usage: npx tsx scripts/generate-admin-hash.ts <your_password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\n--- Admin Password Hash Generated ---');
  console.log('Password:', password);
  console.log('Hash:    ', hash);
  console.log('\nAdd this to your .env.local file:');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
});

