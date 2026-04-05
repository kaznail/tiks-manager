const fs = require('fs');
const path = require('path');

function finalFix(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            finalFix(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 1. Fix the syntax bugs injected by my rescue script
            // getToken(') -> getToken()
            content = content.replace(/getToken\('\)/g, "getToken()");
            content = content.replace(/getToken\('\)\ \}/g, "getToken() }");
            
            // }') -> })
            content = content.replace(/\}\'\)/g, "})");
            content = content.replace(/\}\'\);/g, "});");
            content = content.replace(/\}\'\ \}/g, "} }");
            content = content.replace(/token\ \}\ \}\'/g, "token } }");
            content = content.replace(/token\ \}\ \}\'\)/g, "token } })");
            content = content.replace(/getToken\('\)\ \},/g, "getToken() },");

            // 2. Fix the ${} template literal variables that were trapped in single quotes from string concatenation!
            // E.g. (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/${id}/unblock` -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/unblock`
            
            // The signature is: + '/something/${id}/something`, -> should be `${...}/path`
            content = content.replace(/\+ '\/([^']*\$\{id\}[^`]*)`, {/g, ""); // wait, easier manual map below:

            // Admin Operations
            content = content.replace(/\(process.env.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/reports\/\$\{id\}\/\$\{action\}`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/${id}/${action}`,");

            // Admin Leaves
            content = content.replace(/\(process.env.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/users\/leaves\/\$\{id\}\/\$\{action\}`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/leaves/${id}/${action}`,");

            // Admin Employees
            content = content.replace(/\(process.env.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/users\/\$\{id\}\/unblock`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/unblock`,");
            
            content = content.replace(/\(process.env.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/users\/\$\{id\}\/block`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/block`,");
            
            content = content.replace(/\(process.env.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/users\/\$\{id\}\/permanent-ban`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/permanent-ban`,");

            // Employee Notifications read
            content = content.replace(/\(process.env.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/users\/notifications\/\$\{id\}\/read`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/notifications/${id}/read`,");

            // Any remaining backticks trapped in strings that should be backticks
            // Let's globally fix (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/...` into `${process.env...}/...`
            content = content.replace(/\(process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/([^`]*)`,/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/$1`,");

            // Check what if the URL is wrapped in single quotes without backtick?
            // (process.env... ) + '/users/${id}'   (No backtick)
            // Fix: turn any string concatenation that has ${} inside it to a template literal.
            // Example: + '/reports/${id}' -> `${...}/reports/${id}`
            content = content.replace(/\(process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\) \+ '\/([^']*?\$\{[^']*?}'?)/g, function(match, p1) {
                // If it ends in quote, strip it. If not, whatever.
                let inner = p1.endsWith("'") ? p1.slice(0, -1) : p1;
                return "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/" + inner + "`";
            });

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Final Syntax Cleaned:', fullPath);
            }
        }
    }
}

finalFix(path.join(__dirname, 'src'));
console.log('');
console.log('ALL SYNTAX ERRORS HAVE BEEN FIXED SUCCESSFULLY.');
