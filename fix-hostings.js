const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Pattern 1: 'http://localhost:3001/...'
            content = content.replace(/'http:\/\/localhost:3001\//g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/");
            // Also replace if it doesn't have a trailing slash
            content = content.replace(/'http:\/\/localhost:3001'/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`");

            // Pattern 2: `http://localhost:3001/...` (backticks)
            content = content.replace(/`http:\/\/localhost:3001\//g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/");

            // Pattern 3: "http://localhost:3001/..." (double quotes)
            content = content.replace(/"http:\/\/localhost:3001\//g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/");

            if (content !== originalContent) {
                // Fix missing closing backticks for single/double quote replacements
                content = content.replace(/(\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}\/[^']*)'/g, "$1`");
                content = content.replace(/(\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}\/[^"]*)"/g, "$1`");
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

fixFiles(srcDir);
console.log('Done! All URLs are now dynamic.');
