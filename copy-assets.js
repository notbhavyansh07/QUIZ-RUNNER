const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'index.html',
  'sw.js',
  'manifest.json'
];

const dirsToCopy = [
  'css',
  'js',
  'data',
  'images'
];

const destDir = path.join(__dirname, 'www');

// Clean and recreate www directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

// Helper to copy directory recursively
function copyFolderRecursiveSync(source, target) {
  let files = [];
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file));
      }
    });
  }
}

// Copy single files
filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(destDir, file));
    console.log(`Copied file: ${file}`);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const src = path.join(__dirname, dir);
  if (fs.existsSync(src)) {
    copyFolderRecursiveSync(src, destDir);
    console.log(`Copied folder: ${dir}`);
  }
});

console.log('All web assets copied to www folder successfully!');
