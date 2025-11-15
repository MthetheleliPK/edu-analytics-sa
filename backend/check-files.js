const fs = require('fs');
const path = require('path');

console.log('Checking models directory...\n');

const modelsPath = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsPath);

console.log('Files in models directory:');
files.forEach(file => {
  const fullPath = path.join(modelsPath, file);
  const stats = fs.statSync(fullPath);
  console.log(`- ${file} (${stats.isFile() ? 'File' : 'Directory'})`);
});

// Check specifically for Assessment.js
console.log('\nLooking for Assessment.js:');
const assessmentFiles = files.filter(f => f.toLowerCase().includes('assessment'));
assessmentFiles.forEach(file => {
  console.log(`Found: ${file}`);
});

if (assessmentFiles.length === 0) {
  console.log('❌ No Assessment file found!');
} else if (!assessmentFiles.includes('Assessment.js')) {
  console.log('❌ Assessment.js not found with exact name!');
  console.log('But found these similar files:', assessmentFiles);
}