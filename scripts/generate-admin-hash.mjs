import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/generate-admin-hash.mjs <your_password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\n===========================================');
  console.log('  Admin Password Hash Successfully Generated');
  console.log('===========================================');
  console.log('Password: ', password);
  console.log('Hash:     ', hash);
  console.log('\nAdd to your .env.local (and Vercel Environment Variables):');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
});

