const fs = window.require('fs');
const path = require('path');

const ROOT_DIR = require('path').join('..', '..');

function listDirs(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isDirectory());
}

function listFiles(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isFile());
}

<<<<<<< HEAD
export { listDirs, listFiles, ROOT_DIR }
=======
function disableUIElements(uiSchema, scopes) {
    for (var prop of uiSchema.elements) {
        if (scopes.includes(prop.scope))
            prop.rule = {
                effect: "DISABLE",
                condition: {
                    scope: prop.scope,
                    schema: {}
                }
            }
    }
}

<<<<<<< HEAD
<<<<<<< Updated upstream
export { disableUIElements, listDirs, listFiles, ROOT_DIR }
=======
=======
>>>>>>> master
export {
    checkRootDir,
    disableUIElements,
    listDirs,
    listFiles,
    registerApp,
    showAlert,
    ROOT_DIR
}
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> master
>>>>>>> FALCON
