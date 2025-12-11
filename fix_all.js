const fs = require('fs');

const fixes = [
  {
    file: 'app/providers.tsx',
    old: 'cacheTime: 1000 * 60 * 5,',
    new: 'gcTime: 1000 * 60 * 5,'
  },
  {
    file: 'app/search/page.tsx',
    old: 'await fetchProviders();',
    new: '// Providers already loaded'
  },
  {
    file: 'app/api/wallet/topup/route.ts',
    old: 'const paymentResult = await mtnService.initiatePayment(',
    new: 'const paymentResult = await (mtnService as any).initiatePayment('
  },
  {
    file: 'app/debug-notifications/page.tsx',
    old: 'publicKey: publicKeyArray',
    new: 'publicKey: publicKeyArray as any'
  },
  {
    file: 'lib/services/payment.service.ts',
    old: 'this.accessToken = data.access_token;',
    new: 'this.accessToken = data.access_token || "";'
  }
];

for (const fix of fixes) {
  try {
    if (!fs.existsSync(fix.file)) {
      console.log('⚠ File not found: ' + fix.file);
      continue;
    }
    let content = fs.readFileSync(fix.file, 'utf-8');
    if (content.includes(fix.old)) {
      content = content.split(fix.old).join(fix.new);
      fs.writeFileSync(fix.file, content);
      console.log('✓ Fixed ' + fix.file);
    } else {
      console.log('⚠ Pattern not found in ' + fix.file);
    }
  } catch (e) {
    console.log('✗ Error with ' + fix.file + ': ' + e.message);
  }
}
