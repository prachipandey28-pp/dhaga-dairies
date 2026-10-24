const fs = require('fs');

const file = 'C:/Users/anshu pandey/.gemini/antigravity/scratch/dhaga-diaries/node_modules/next/dist/build/swc/index.js';
let content = fs.readFileSync(file, 'utf8');

const target = `            let pkgPath = pkg;
            if (importPath) {
                // the import path must be exact when not in node_modules
                pkgPath = _path.default.join(importPath, pkg, 'wasm.js');
            }`;

const replacement = `            let pkgPath = pkg;
            try { pkgPath = require.resolve(pkg + '/wasm.js'); } catch (_) {}
            if (importPath) {
                // the import path must be exact when not in node_modules
                pkgPath = _path.default.join(importPath, pkg, 'wasm.js');
            }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully patched next/dist/build/swc/index.js!');
} else {
  console.log('Target not found in next/dist/build/swc/index.js');
}
