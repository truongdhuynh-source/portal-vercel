import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import {
updateFile,
updateInwebDependencies,
getReleaseDependenciesVersion,
getPackageVersion,
PACKAGE_JSON_FILE_NAME } from './helper.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateDependenciesVersionPackageJson(repoDir, version) {

    const packageJsonPath = path.join(repoDir, PACKAGE_JSON_FILE_NAME);

    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    let updatedInWebDeps;
    const dependenciesReleaseVersion = getReleaseDependenciesVersion(version);

    const updated = updateFile(packageJsonPath, (currentContent) => {
        const packageJsonObject = JSON.parse(currentContent);

        updatedInWebDeps = updateInwebDependencies(packageJsonObject, dependenciesReleaseVersion);
        return JSON.stringify(packageJsonObject, null, 2) + '\n';
    });

    if (updated && updatedInWebDeps) {
        for (const inwebPackage in updatedInWebDeps) {
            execSync(`npm install ${inwebPackage}`, { cwd: repoDir });
        }
        console.log(`dependencies updated to ${dependenciesReleaseVersion}`);
    } else {
        console.log('everything is up to date');
    }
}

function main() {
    const workDir = path.resolve(__dirname, '..');

    const currentVersion = getPackageVersion(path.join(workDir, PACKAGE_JSON_FILE_NAME));
    console.log('current version: ' + currentVersion);

    updateDependenciesVersionPackageJson(workDir, currentVersion);
}

(() => {
    try {
        main();
    } catch (err) {
        console.error('ERROR EXECUTING: ' + err.message);
        process.exitCode = 1;
    }
})();
