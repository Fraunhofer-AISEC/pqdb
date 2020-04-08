import React from 'react';
import { SelectOrCreate } from './BaseComponents';
import { listDirs, ROOT_DIR } from './Tools';
import { Box, Grid, Paper } from '@material-ui/core';
const fs = window.require('fs');
const path = require('path');
const yaml = require('js-yaml')


class SelectScheme extends React.Component {
    constructor(props) {
        super(props);
        this.history = props.history;
        this.typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") }
        this.state = {
            enc: listDirs(this.typeDirs['enc']),
            sig: listDirs(this.typeDirs['sig'])
        };
    }

    submitForm(type, name, create) {
        if (create === fs.existsSync(path.join(this.typeDirs[type], name, name + ".yaml"))) {
            alert("Error. Unexpected existance or non-existance of scheme file.");
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.typeDirs[type], name);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = { name: name };
                fs.writeFileSync(path.join(dir, name + ".yaml"), yaml.dump(data));
                alert('Scheme "' + name + '" was successfully created.');
            } catch {
                alert('Scheme "' + name + '" could not be created.');
            }

            var newState = {};
            newState[type] = listDirs(this.typeDirs[type]);
            this.setState(newState);

            return;
        }

        this.history.push('/' + type + '/' + name + '/');
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Encryption Schemes</h2>
                            <SelectOrCreate schemes={this.state.enc} addNew={false} action={(data) => this.submitForm("enc", data.name, false)} />
                            <SelectOrCreate schemes={this.state.enc} addNew={true} action={(data) => this.submitForm("enc", data.name, true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper >
                        <Box px={2} pt={1} pb={2}>
                            <h2>Signature Schemes</h2>
                            <SelectOrCreate schemes={this.state.sig} addNew={false} action={(data) => this.submitForm("sig", data.name, false)} />
                            <SelectOrCreate schemes={this.state.sig} addNew={true} action={(data) => this.submitForm("sig", data.name, true)} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid >
        );
    }

}

export default SelectScheme;


