const fs = require('fs');
const path = require('path');

// Get all TypeScript files in app/api
function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const apiFiles = getAllFiles('./app/api');
const appFiles = getAllFiles('./app').filter(f => !f.includes('\\api\\'));
const libFiles = getAllFiles('./lib');
const componentFiles = getAllFiles('./components');

const allFiles = [...apiFiles, ...appFiles, ...libFiles, ...componentFiles];

let total = 0;
allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Add (supabase as any) cast - avoid double casting
  // Pattern 1: Direct supabase.from( -> (supabase as any).from(
  content = content.replace(/(?<!\()supabase\.from\(/g, '(supabase as any).from(');
  content = content.replace(/(?<!\()adminSupabase\.from\(/g, '(adminSupabase as any).from(');
  content = content.replace(/(?<!\()supabase\.rpc\(/g, '(supabase as any).rpc(');

  // Pattern 2: await supabase -> await (supabase as any)
  content = content.replace(/await supabase\s*\n\s*\.from\(/g, 'await (supabase as any)\n      .from(');
  content = content.replace(/await adminSupabase\s*\n\s*\.from\(/g, 'await (adminSupabase as any)\n      .from(');

  if (content !== original) {
    fs.writeFileSync(file, content);
    total++;
    console.log('Patched:', file);
  }
});

console.log('\nTotal files patched:', total);
