import fs from 'fs';
import os from 'os';
import semver from 'semver';
import simpleGit from 'simple-git';

const VIEWER_REPO = 'gitlab.opendesign.com/oda/websdk/demo-viewer';
const PACKAGE_JSON_FILE_NAME = 'package.json';
const PACKAGE_LOCK_JSON_FILE_NAME = 'package-lock.json';
const dependenciesFieldNames = ['dependencies', 'devDependencies', 'peerDependencies', 'requires'];
const mainClientPackagePrefix = '@inweb';

function updateFile(filePath, updateContent) {
    if (!(filePath && updateContent)) {
        return false;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    if (!fileContent) {
        return false;
    }

    const newFileContent = updateContent(fileContent).replaceAll("\n", os.EOL);

    if (fileContent === newFileContent) {
        return false;
    }

    fs.writeFileSync(filePath, newFileContent);
    return true;
}

function cloneRepo(gitInstance, repo, branch, localPath) {
    const remote = `https://${repo}`;

    return gitInstance.clone(remote,
        localPath,
        {
            '--branch': `${branch}`
        });
}

function updatePackageVersion(packageFileObject, newVersion) {
    if (packageFileObject.version !== newVersion) {
        packageFileObject.version = newVersion;
    }
    if (
        packageFileObject.packages &&
        packageFileObject.packages[''] &&
        packageFileObject.packages[''].version !== newVersion
    ){
        packageFileObject.packages[''].version = newVersion;
    }
}

function updateInwebDependencies(packageObject, newVersion) {
    const updatedDeps = {};

    for (const depField of dependenciesFieldNames) {
        if (packageObject[depField]) {
            const dependenciesObj = packageObject[depField];
            for (const key in dependenciesObj) {
                if (key.startsWith(mainClientPackagePrefix) && dependenciesObj[key] !== newVersion) {
                    dependenciesObj[key] = newVersion;
                    updatedDeps[key] = newVersion;
                }
            }
        }
    }
    return updatedDeps;
}

function getReleaseDependenciesVersion(newVersion) {
    return `~${semver.major(newVersion)}.${semver.minor(newVersion)}`;
}

function getPackageVersion(packageJsonPath) {
    const packageJsonFileContent = fs.readFileSync(packageJsonPath, 'utf-8');

    const packageJsonObject = JSON.parse(packageJsonFileContent);

    return packageJsonObject.version;
}

async function isBranchExist(repo, branch) {
    const git = simpleGit({ binary: 'git' });

    await git.cwd(repo);
    const branches = await git.branch({ '--remote': null });

    return !!branches.branches[`origin/${branch}`];
}

async function getNewVersion(oldVersion, repo, branch) {
    let newVersion = oldVersion;

    if (branch === 'master' && (await isBranchExist(repo, `release/${semver.major(oldVersion)}.${semver.minor(oldVersion)}`))) {
        if (+semver.minor(oldVersion) < 12) {
            newVersion = semver.inc(oldVersion, 'minor');
        } else {
            newVersion = semver.inc(oldVersion, 'major');
            newVersion = semver.inc(newVersion, 'minor');
        }
    } else {
        newVersion = semver.inc(oldVersion, 'patch');
    }

    return newVersion;
}

export {
    updateFile,
    cloneRepo,
    updatePackageVersion,
    updateInwebDependencies,
    getReleaseDependenciesVersion,
    getPackageVersion,
    isBranchExist,
    getNewVersion,
    VIEWER_REPO,
    PACKAGE_JSON_FILE_NAME,
    PACKAGE_LOCK_JSON_FILE_NAME
};
