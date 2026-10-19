/*
 * Copyright (c) 2023-2026, Fraunhofer AISEC.
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

import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Generate } from '@jsonforms/core';
import { SelectOrCreate, SelectList, EditFile } from './BaseComponents';
import { Grid, Paper, Box } from '@mui/material';
import { listFiles, ROOT_DIR, disableUIElements, showAlert } from './Tools';
const fs = window.require('fs');
const path = window.require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") };

function generateChoices(baseDir, type) {
    return listFiles(path.join(baseDir, type))
        .filter(x => x.endsWith('.yaml')).map(x => x.substring(0, x.length - 5));
}

function SubtypeOverview() {
    const { type, schemeIdentifier, flavorIdentifier, subType, subIdentifier } = useParams();

    const { data, schema, uiSchema } = useMemo(() => {
        const targetFile = path.join(typeDirs[type], schemeIdentifier, flavorIdentifier,
            subType, subIdentifier + '.yaml');
        let data = yaml.load(fs.readFileSync(targetFile, 'utf-8'));
        const schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema',
            { 'bench': 'benchmark', 'param': 'paramset', 'impl': 'implementation' }[subType] + '.json')));
        const uiSchema = Generate.uiSchema(schema);
        if (subType === 'bench') {
            var parts = subIdentifier.split('_');
            data.impl = parts[0];
            data.param = parts[1];
            disableUIElements(uiSchema, ['#/properties/impl', '#/properties/param']);
        }
        return { data, schema, uiSchema };
    }, [type, schemeIdentifier, flavorIdentifier, subType, subIdentifier]);

    function onPreSave(data) {
        if (subType === 'bench') {
            delete data.param;
            delete data.impl;
        }
    }

    return (
        <Box sx={{ px: 2, pt: 1, pb: 2 }}>
            <h2>{{
                'bench': 'Benchmark', 'param': 'Parameter Set', 'impl': 'Implementation'
            }[subType] + " Properties"}</h2>
            <EditFile filePath={path.join(typeDirs[type], schemeIdentifier, flavorIdentifier,
                subType, subIdentifier + '.yaml')} initialData={data} schema={schema}
                uiSchema={uiSchema} onPreSave={onPreSave} />
        </Box>
    );
}

function FlavorOverview() {
    const { schemeIdentifier, flavorIdentifier, type } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const baseDir = path.join(typeDirs[type], schemeIdentifier, flavorIdentifier);

    const [param, setParam] = useState(() => generateChoices(baseDir, 'param'));
    const [impl, setImpl] = useState(() => generateChoices(baseDir, 'impl'));
    const [bench, setBench] = useState(() => generateChoices(baseDir, 'bench'));

    const benchRegex = '^(:?' + impl.join('|') + ')_(:?' + param.join('|') + ')_[A-Za-z0-9-]+$';

    const flavorFile = useMemo(() =>
        path.join(typeDirs[type], schemeIdentifier, flavorIdentifier, flavorIdentifier + '.yaml'),
        [type, schemeIdentifier, flavorIdentifier]);

    const schema = useMemo(() =>
        JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'flavor.json'), 'utf-8')),
        []);

    function submitForm(identifier, type, create) {
        if (create === fs.existsSync(path.join(baseDir, type, identifier + ".yaml"))) {
            showAlert('Error. Unexpected existance or non-existance of flavor file.', 'error');
            return;
        }

        if (create) {
            try {
                var dir = path.join(baseDir, type);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = {};
                fs.writeFileSync(path.join(dir, identifier + ".yaml"), yaml.dump(data));
                showAlert('"' + identifier + '" was successfully created.', 'success');
            } catch {
                showAlert('"' + identifier + '" could not be created.', 'error');
            }

            const fresh = generateChoices(baseDir, type);
            if (type === 'param') setParam(fresh);
            else if (type === 'impl') setImpl(fresh);
            else if (type === 'bench') setBench(fresh);

            return;
        }

        navigate(location.pathname + type + '/' + identifier + '/');
        window.scrollTo(0, 0);
    }

    return (
        <Grid container direction="column" spacing={3}>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Flavor Properties</h2>
                        <EditFile filePath={flavorFile} schema={schema} />
                    </Box>
                </Paper>
            </Grid>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Parameter Sets</h2>
                        <SelectList entries={param}
                            action={(identifier) => submitForm(identifier, "param", false)} />
                        <SelectOrCreate schemes={param} addNew={true}
                            action={(data) => submitForm(data.identifier, "param", true)} />
                    </Box>
                </Paper>
            </Grid>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Implementations</h2>
                        <SelectList entries={impl}
                            action={(identifier) => submitForm(identifier, "impl", false)} />
                        <SelectOrCreate schemes={impl} addNew={true}
                            action={(data) => submitForm(data.identifier, "impl", true)} />
                    </Box>
                </Paper>
            </Grid>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Benchmarks</h2>
                        <SelectList entries={bench}
                            action={(identifier) => submitForm(identifier, "bench", false)} />
                        <SelectOrCreate schemes={bench} regex={benchRegex} addNew={true}
                            action={(data) => submitForm(data.identifier, "bench", true)} />
                    </Box>
                </Paper>
            </Grid>

        </Grid >
    );
}

export { FlavorOverview, SubtypeOverview };
export default FlavorOverview;
