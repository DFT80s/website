import { defineConfig } from 'vite';
import { resolve, relative } from 'path';
import { readdirSync, statSync } from 'fs';

// Recursively find all .html files in the given directory and its subdirectories
function findHtmlFiles(dir) {
    let results = [];
    for (const file of readdirSync(dir)) {
        const fullPath = resolve(dir, file);
        // Skip build output and dependency directories
        if (file === 'dist' || file === 'node_modules' || file === '.git') {
            continue;
        }
        if (statSync(fullPath).isDirectory()) {
            // If the file is a directory, search inside it
            results = results.concat(findHtmlFiles(fullPath));
        } else if (file.endsWith('.html')) {
            // If the file is an .html file, add its full path to the results
            results.push(fullPath);
        }
    }
    return results;
}

export default defineConfig({
    build: {
        rollupOptions: {
            input: Object.fromEntries(
                // Create an entry for each .html file found
                findHtmlFiles(__dirname).map(file => [
                    // Use the relative path (without .html) as the entry name
                    relative(__dirname, file).replace(/\.html$/, ''),
                    file,
                ])
            ),
        },
    },
});
