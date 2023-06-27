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
import { listFiles, ROOT_DIR, disableUIElements, showAlert } from './Tools';
const fs = window.require('fs');
const path = window.require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") };

class SubtypeOverview extends React.Component {
    constructor(props) {
        super(props)
        this.type = props.match.params.type;
        this.schemeIdentifier = props.match.params.schemeIdentifier;
        this.flavorIdentifier = props.match.params.flavorIdentifier;
        this.subType = props.match.params.subType;
        this.subIdentifier = props.match.params.subIdentifier;

        this.targetFile = path.join(typeDirs[this.type], this.schemeIdentifier, this.flavorIdentifier,
            this.subType, this.subIdentifier + '.yaml');
        this.data = yaml.load(fs.readFileSync(this.targetFile, 'utf-8'));
        this.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema',
            { 'bench': 'benchmark', 'param': 'paramset', 'impl': 'implementation' }[this.subType] + '.json')));
        this.uiSchema = Generate.uiSchema(this.schema);
        if (this.subType === 'bench') {
            var parts = this.subIdentifier.split('_');
            this.data.impl = parts[0];
            this.data.param = parts[1];
            disableUIElements(this.uiSchema, ['#/properties/impl', '#/properties/param']);
        }
    }

    onPreSave(data) {
        if (this.subType === 'bench') {
            delete data.param;
            delete data.impl;
        }
    }

    render() {
        return (
            <Box px={2} pt={1} pb={2}>
                <h2>{{
                    'bench': 'Benchmark', 'param': 'Parameter Set', 'impl': 'Implementation'
                }[this.subType] + " Properties"}</h2>
                <EditFile filePath={this.targetFile} initialData={this.data} schema={this.schema}
                    uiSchema={this.uiSchema} onPreSave={(data) => this.onPreSave(data)} />
            </Box>
        );
    }
}

class FlavorOverview extends React.Component {
    constructor(props) {
        super(props)
        this.schemeIdentifier = props.match.params.schemeIdentifier;
        this.identifier = props.match.params.flavorIdentifier;
        this.type = props.match.params.type;
        this.baseDir = path.join(typeDirs[this.type], this.schemeIdentifier, this.identifier);
        this.state = {
            param: this.generateChoices('param'),
            impl: this.generateChoices('impl'),
            bench: this.generateChoices('bench')
        };

        this.benchRegex = '^(:?' + this.state.impl.join('|') + ')_(:?' + this.state.param.join('|') + ')_[A-Za-z0-9-]+$';
        this.history = props.history;

        this.flavorFile = path.join(typeDirs[this.type], this.schemeIdentifier, this.identifier, this.identifier + '.yaml');
        this.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'flavor.json'), 'utf-8'));
    }

    generateChoices(type) {
        return listFiles(path.join(this.baseDir, type))
            .filter(x => x.endsWith('.yaml')).map(x => x.substring(0, x.length - 5));
    }

    submitForm(identifier, type, create) {
        if (create === fs.existsSync(path.join(this.baseDir, type, identifier + ".yaml"))) {
            showAlert('Error. Unexpected existance or non-existance of flavor file.', 'error');
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.baseDir, type);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = {};
                fs.writeFileSync(path.join(dir, identifier + ".yaml"), yaml.dump(data));
                showAlert('"' + identifier + '" was successfully created.', 'success');
            } catch {
                showAlert('"' + identifier + '" could not be created.', 'error');
            }

            var newState = {};
            newState[type] = this.generateChoices(type);
            this.setState(newState);

            return;
        }

        this.history.push(this.history.location.pathname + type + '/' + identifier + '/');
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Flavor Properties</h2>
                            <EditFile filePath={this.flavorFile} schema={this.schema} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Parameter Sets</h2>
                            <SelectList entries={this.state.param}
                                action={(identifier) => this.submitForm(identifier, "param", false)} />
                            <SelectOrCreate schemes={this.state.param} addNew={true}
                                action={(data) => this.submitForm(data.identifier, "param", true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Implementations</h2>
                            <SelectList entries={this.state.impl}
                                action={(identifier) => this.submitForm(identifier, "impl", false)} />
                            <SelectOrCreate schemes={this.state.impl} addNew={true}
                                action={(data) => this.submitForm(data.identifier, "impl", true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Benchmarks</h2>
                            <SelectList entries={this.state.bench}
                                action={(identifier) => this.submitForm(identifier, "bench", false)} />
                            <SelectOrCreate schemes={this.state.bench} regex={this.benchRegex} addNew={true}
                                action={(data) => this.submitForm(data.identifier, "bench", true)} />
                        </Box>
                    </Paper>
                </Grid>

            </Grid >
        );
    }
}

export { FlavorOverview, SubtypeOverview };
export default FlavorOverview;
