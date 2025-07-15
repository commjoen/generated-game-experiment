// scripts/inject-version.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getVersion() {
  let tag = '', commit = '', date = '';
  try {
    tag = execSync('git describe --tags --always --dirty').toString().trim();
    commit = execSync('git rev-parse --short HEAD').toString().trim();
    date = execSync('git log -1 --format=%cd --date=short').toString().trim();
  } catch (e) {
    tag = 'unknown';
    commit = 'unknown';
    date = 'unknown';
  }
  return `${tag} (${commit}, ${date})`;
}

const version = getVersion();

const files = [
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../src/main.ts'),
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/__VERSION__/g, version);
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Injected version into ${file}`);
  }
}); 