const fs = window.require('fs');
const path = require('path');

const ROOT_DIR = require('path').join('..', '..');

function listDirs(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isDirectory());
}

function listFiles(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isFile());
}

export { listDirs, listFiles, ROOT_DIR }
