/*
 * Copyright (c) 2023, Fraunhofer AISEC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { Generate } from '@jsonforms/core';
import { SelectOrCreate, SelectList, EditFile } from './BaseComponents';
import { Grid, Paper, Box } from '@mui/material';
import { listDirs, ROOT_DIR, disableUIElements, showAlert } from './Tools';
const fs = window.require('fs');
const path = window.require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") }

class SchemeOverview extends React.Component {
    constructor(props) {
        super(props)
        this.identifier = props.match.params.schemeIdentifier;
        this.type = props.match.params.type;
        this.baseDir = path.join(typeDirs[this.type], this.identifier);
        this.state = { flavors: listDirs(this.baseDir) };
        this.history = props.history;

        this.schemeFile = path.join(typeDirs[this.type], this.identifier, this.identifier + '.yaml');
        this.data = yaml.load(fs.readFileSync(this.schemeFile, 'utf-8'));
        this.data.type = this.type;
        if (!('stateful' in this.data))
            this.data.stateful = false;
        this.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'scheme.json'), 'utf-8'));
        this.uiSchema = Generate.uiSchema(this.schema);
        disableUIElements(this.uiSchema, ['#/properties/type']);
    }

    submitForm(identifier, create) {
        if (create === fs.existsSync(path.join(this.baseDir, identifier, identifier + ".yaml"))) {
            showAlert("Error. Unexpected existance or non-existance of flavor file.", "error");
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.baseDir, identifier);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ['', 'bench', 'impl', 'param'].map(x => path.join(dir, x))
                    .filter(x => !fs.existsSync(x)).forEach(x => fs.mkdirSync(x));
                var data = {};
                fs.writeFileSync(path.join(dir, identifier + ".yaml"), yaml.dump(data));
                showAlert('Flavor "' + identifier + '" was successfully created.', 'success');
            } catch {
                showAlert('Flavor "' + identifier + '" could not be created.', 'error');
            }

            this.setState({ flavors: listDirs(this.baseDir) });
            return;
        }
        var link = this.history.location.pathname + identifier + "/";
        this.history.push(link);
        window.scrollTo(0, 0);
    }

    onPreSave(data) {
        delete data.type;
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper >
                        <Box px={2} pt={1} pb={2}>
                            <h2>Scheme Properties</h2>
                            <EditFile filePath={this.schemeFile} initialData={this.data} schema={this.schema}
                                uiSchema={this.uiSchema} onPreSave={(data) => this.onPreSave(data)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Flavours</h2>
                            <SelectList entries={this.state.flavors}
                                action={(identifier) => this.submitForm(identifier, false)} />
                            <SelectOrCreate schemes={this.state.flavors} addNew={true}
                                action={(data) => this.submitForm(data.identifier, true)} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

export default SchemeOverview;
