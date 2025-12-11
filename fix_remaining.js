const fs = require('fs');

const fixes = [
  {
    file: 'app/providers.tsx',
    old: 'cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes',
    new: 'gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes'
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
