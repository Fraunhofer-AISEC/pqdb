import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';
import ReactDOM from 'react-dom';

const fs = window.require('fs');
const path = require('path');

var argv = window.require('electron').remote.process.argv;

var ROOT_DIR = path.join('..', '..');
if (argv.length === 2 || argv.length === 3) {
    ROOT_DIR = argv[argv.length - 1];
}
Object.freeze(ROOT_DIR);

var application = null;
function registerApp(app) {
    application = app;
}

function showAlert(msg, severity) {
    application.openAlert(msg, severity);
}

function checkRootDir() {
    return fs.existsSync(ROOT_DIR) && fs.existsSync(path.join(ROOT_DIR, "encryption")) &&
        fs.existsSync(path.join(ROOT_DIR, "signatures")) && fs.existsSync(path.join(ROOT_DIR, "schema"));
}

function listDirs(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isDirectory());
}

function listFiles(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isFile());
}

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

const getUserConfirmation = (message, callback, title, yesmsg, nomsg) => {
    const modal = document.createElement('div');
    document.body.appendChild(modal);

    const withCleanup = (answer) => {
        ReactDOM.unmountComponentAtNode(modal);
        document.body.removeChild(modal);
        callback(answer);
    }

    // dirty hack because <Prompt> does not allow passing other parameters than `message`
    const knownQuestions = {
        "Discard changes?": {
            message: [<p>You are about to leave this view, but there are unsaved changes.</p>, <p>Are you sure you want to discard your changes?</p>],
            yesmsg: "Discard",
            nomsg: "Keep Editing",
        }
    };
    if ( knownQuestions.hasOwnProperty(message) ) {
        let title = message;
        message = knownQuestions[title].message;
        yesmsg = knownQuestions[title].yesmsg;
        nomsg = knownQuestions[title].nomsg;
    }

    ReactDOM.render(
        <Dialog
            open={true}
            onClose={() => withCleanup(false)}>
            <DialogTitle>{ title ?? "Confirm" }</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    { message }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => withCleanup(false)} color="primary">
                    { nomsg ?? "Cancel" }
            </Button>
                <Button onClick={() => withCleanup(true)} color="primary" autoFocus>
                    { yesmsg ?? "OK" }
            </Button>
            </DialogActions>
        </Dialog>,
        modal
    );
}

export {
    checkRootDir,
    disableUIElements,
    listDirs,
    listFiles,
    registerApp,
    showAlert,
    getUserConfirmation,
    ROOT_DIR
}
