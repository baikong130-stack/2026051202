const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'src', 'components')
];

const REPLACEMENTS = {
  // Backgrounds
  'bg-slate-950': 'bg-slate-50',
  'bg-slate-900': 'bg-white',
  'bg-slate-800': 'bg-slate-100',
  'bg-slate-700': 'bg-slate-200',
  
  // Texts
  'text-slate-100': 'text-slate-900',
  'text-slate-200': 'text-slate-800',
  'text-slate-300': 'text-slate-700',
  'text-slate-400': 'text-slate-600',
  'text-slate-600': 'text-slate-400',
  // text-slate-500 is neutral, skip
  
  // Borders
  'border-slate-800': 'border-slate-200',
  'border-slate-700': 'border-slate-300',
  'border-slate-600': 'border-slate-400',

  // Divide
  'divide-slate-800': 'divide-slate-200',
};

// Custom edge cases can be handled here
function processContent(content) {
  let newContent = content;

  // Process all keys
  for (const [dark, light] of Object.entries(REPLACEMENTS)) {
    // Replace whole words only, keeping opacity modifiers if present
    // e.g. bg-slate-900/50 -> bg-white/50
    // We use a regex to match the class name followed by optional opacity /xxx, or boundaries
    const regex = new RegExp(dark + '(?![\\w-])', 'g');
    newContent = newContent.replace(regex, light);
  }

  // ECharts specific text colors in JSX
  // Replacing '#f1f5f9' to '#0f172a' (slate-900)
  newContent = newContent.replace(/#f1f5f9/ig, '#0f172a');
  // Replacing '#94a3b8' to '#475569' (slate-600)
  newContent = newContent.replace(/#94a3b8/ig, '#475569');
  // Replacing pie chart colors in App.jsx (dark space #334155 -> #e2e8f0)
  newContent = newContent.replace(/#334155/ig, '#e2e8f0');

  return newContent;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const updated = processContent(content);
      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

DIRECTORIES.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log('Theme conversion completed.');
