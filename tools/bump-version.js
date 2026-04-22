import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 1. Bump package.json
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version || '1.0.0';
const parts = oldVersion.split('.');
parts[2] = parseInt(parts[2] || 0, 10) + 1;
const newVersion = parts.join('.');
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`\n🚀 [Aegis] Bumped package.json: ${oldVersion} -> ${newVersion}`);

// 2. Bump build.gradle files
function bumpGradle(gradlePath) {
    if (!fs.existsSync(gradlePath)) return;
    let content = fs.readFileSync(gradlePath, 'utf8');
    
    let newCode = 1;
    content = content.replace(/versionCode\s+(\d+)/, (match, code) => {
        newCode = parseInt(code, 10) + 1;
        return `versionCode ${newCode}`;
    });

    content = content.replace(/versionName\s+["']([^"']+)["']/, (match, name) => {
        return `versionName "${newVersion}"`;
    });

    fs.writeFileSync(gradlePath, content);
    console.log(`📱 [Aegis] Bumped Android APK: versionCode ${newCode}, versionName "${newVersion}" in ${path.relative(root, gradlePath)}`);
}

bumpGradle(path.join(root, 'android/app/build.gradle'));
bumpGradle(path.join(root, 'android-admin/app/build.gradle'));
