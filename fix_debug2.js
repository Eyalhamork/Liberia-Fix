const fs = require('fs');

let content = fs.readFileSync('app/debug-notifications/page.tsx', 'utf-8');

// Try simpler replacement
const replacement = content.replace(
  'applicationServerKey: urlBase64ToUint8Array(vapidKey),',
  'applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,'
);

if (replacement !== content) {
  fs.writeFileSync('app/debug-notifications/page.tsx', replacement);
  console.log('✓ Fixed app/debug-notifications/page.tsx');
} else {
  console.log('⚠ Pattern not found');
}
