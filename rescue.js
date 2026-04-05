const fs = require('fs');
const path = require('path');

function rescueFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            rescueFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 1. Revert double NEXT_PUBLIC_API_URL injections
            content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| `\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}`\}/g, "http://localhost:3001");
            content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| "\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}"\}/g, "http://localhost:3001");
            
            // 2. Revert single NEXT_PUBLIC_API_URL injections
            content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}/g, "http://localhost:3001");

            // 3. Fix the mixed quotes 'http://localhost:3001/...'
            content = content.replace(/fetch\(`http:\/\/localhost:3001([^']*)',/g, "fetch('http://localhost:3001$1',");
            content = content.replace(/fetch\(`http:\/\/localhost:3001([^"]*)",/g, "fetch(\"http://localhost:3001$1\",");
            content = content.replace(/fetch\(`http:\/\/localhost:3001([^\)]*)\)/g, "fetch('http://localhost:3001$1')");

            // 4. Fix syntax corruptions caused by the regex matching [^']*' or [^"]*"
            content = content.replace(/method: `(POST|PUT|DELETE|GET)',/g, "method: '$1',");
            content = content.replace(/method: `(POST|PUT|DELETE|GET)",/g, "method: \"$1\",");
            
            content = content.replace(/\{ `(Authorization|Content-Type)':/g, "{ '$1':");
            content = content.replace(/\{ `(Authorization|Content-Type)":/g, "{ \"$1\":");

            content = content.replace(/className=`/g, 'className="');
            // Fix double backticks in URLs that might have been unblock
            content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, "`http://localhost:3001$1`");

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Rescued:', fullPath);
            }
        }
    }
}

rescueFiles(path.join(__dirname, 'src'));
console.log('Done! Running phase 2 (clean api replace)...');

// Now that files are reset to original, do a CLEAN regex replacement
function applyProperFix(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            applyProperFix(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Proper way to fix URL is to define the API_URL at the top or inside the fetch
            // But since we can't easily parse AST, let's do a safe string replacement:
            // fetch('http://localhost:3001/users') -> fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users')
            
            content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '$1'");
            content = content.replace(/"http:\/\/localhost:3001([^"]*)"/g, "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + \"$1\"");
            content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}$1`");

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Safely Updated:', fullPath);
            }
        }
    }
}

applyProperFix(path.join(__dirname, 'src'));
console.log('All files SAFELY converted to dynamic Netlify URLs!');
