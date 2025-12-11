const fs = require('fs');

let content = fs.readFileSync('app/debug-notifications/page.tsx', 'utf-8');

// Fix the type by casting the return value
const old = `      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });`;

const newFix = `      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });`;

if (content.includes(old)) {
  content = content.split(old).join(newFix);
  fs.writeFileSync('app/debug-notifications/page.tsx', content);
  console.log('✓ Fixed app/debug-notifications/page.tsx');
} else {
  console.log('⚠ Pattern not found in app/debug-notifications/page.tsx');
}
