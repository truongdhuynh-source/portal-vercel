import simpleGit from 'simple-git';
import fs from 'fs';
import os from 'os';
import path from 'path';
import argsParser from 'args-parser';
import process from 'process';
import { fileURLToPath } from 'url';
import {
    cloneRepo,
    updateFile,
    getPackageVersion,
    getNewVersion,
    updatePackageVersion,
    VIEWER_REPO,
    PACKAGE_JSON_FILE_NAME,
    PACKAGE_LOCK_JSON_FILE_NAME } from './helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = argsParser(process.argv);

function updateViewerPackageVersion(repoDir, newVersion) {
    const packageFilesNames = [PACKAGE_JSON_FILE_NAME, PACKAGE_LOCK_JSON_FILE_NAME]

    for (const packageFileName of packageFilesNames) {
        const packageFilesPath = path.join(repoDir, packageFileName);

        if (fs.existsSync(packageFilesPath)) {
            const updated = updateFile(packageFilesPath, (currentContent) => {
                const packageJsonObject = JSON.parse(currentContent);

                updatePackageVersion(packageJsonObject, newVersion);
                return JSON.stringify(packageJsonObject, null, 2) + '\n';
            });

            if (updated) {
                console.log('updated version: ' + packageFilesPath);
            }
        }
    }
}

async function main(targetBranch) {
    const workDirs = {};

    try {
        workDirs.source = path.resolve(__dirname, '..');
        workDirs.target = fs.mkdtempSync(path.join(os.tmpdir(), `${VIEWER_REPO.split('/').pop() + '-'}`));

        const git = simpleGit({ binary: 'git' });
        await cloneRepo(git, VIEWER_REPO, targetBranch, workDirs.target);

        const currentVersion = getPackageVersion(path.join(workDirs.source, PACKAGE_JSON_FILE_NAME));
        console.log('current version: ' + currentVersion);

        const targetVersion = getPackageVersion(path.join(workDirs.target, PACKAGE_JSON_FILE_NAME));
        console.log('target version: ' + targetVersion);

        const newVersion = await getNewVersion(targetVersion, workDirs.target, targetBranch);
        console.log('new version: ' + newVersion);

        updateViewerPackageVersion(workDirs.source, newVersion);

    } finally {
        if (workDirs.target && fs.existsSync(workDirs.target)) {
            fs.rmSync(workDirs.target, { recursive: true });
        }
    }
}

(async () => {
    if (args.target) {
        try {
            await main(args.target);
        } catch (err) {
            console.error('ERROR EXECUTING: ' + err.message);
            process.exitCode = 1;
        }
    } else {
        console.error('Specify the target branch "version.js --target=<target_branch>"');
        process.exitCode = 1;
    }
})();
