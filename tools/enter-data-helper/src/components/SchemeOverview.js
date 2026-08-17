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

import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Generate } from '@jsonforms/core';
import { SelectOrCreate, SelectList, EditFile } from './BaseComponents';
import { Grid, Paper, Box } from '@mui/material';
import { listDirs, ROOT_DIR, disableUIElements, showAlert } from './Tools';
const fs = window.require('fs');
const path = window.require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") }

function SchemeOverview() {
    const { schemeIdentifier, type } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const baseDir = path.join(typeDirs[type], schemeIdentifier);
    const [flavors, setFlavors] = useState(listDirs(baseDir));

    const schemeFile = path.join(typeDirs[type], schemeIdentifier, schemeIdentifier + '.yaml');
    const { data, schema, uiSchema } = useMemo(() => {
        let data = yaml.load(fs.readFileSync(schemeFile, 'utf-8'));
        data.type = type;
        if (!('stateful' in data))
            data.stateful = false;
        const schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'scheme.json'), 'utf-8'));
        const uiSchema = Generate.uiSchema(schema);
        disableUIElements(uiSchema, ['#/properties/type']);
        return { data, schema, uiSchema };
    }, [schemeFile, type]);

    function submitForm(identifier, create) {
        if (create === fs.existsSync(path.join(baseDir, identifier, identifier + ".yaml"))) {
            showAlert("Error. Unexpected existance or non-existance of flavor file.", "error");
            return;
        }

        if (create) {
            try {
                var dir = path.join(baseDir, identifier);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ['', 'bench', 'impl', 'param'].map(x => path.join(dir, x))
                    .filter(x => !fs.existsSync(x)).forEach(x => fs.mkdirSync(x));
                var data = {};
                fs.writeFileSync(path.join(dir, identifier + ".yaml"), yaml.dump(data));
                showAlert('Flavor "' + identifier + '" was successfully created.', 'success');
            } catch {
                showAlert('Flavor "' + identifier + '" could not be created.', 'error');
            }

            setFlavors(listDirs(baseDir));
            return;
        }
        var link = location.pathname + identifier + "/";
        navigate(link);
        window.scrollTo(0, 0);
    }

    const onPreSave = (data) => {
        delete data.type;
    };

    return (
        <Grid container direction="column" spacing={3}>
            <Grid item>
                <Paper >
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Scheme Properties</h2>
                        <EditFile filePath={schemeFile} initialData={data} schema={schema}
                            uiSchema={uiSchema} onPreSave={onPreSave} />
                    </Box>
                </Paper>
            </Grid>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Flavours</h2>
                        <SelectList entries={flavors}
                            action={(identifier) => submitForm(identifier, false)} />
                        <SelectOrCreate schemes={flavors} addNew={true}
                            action={(data) => submitForm(data.identifier, true)} />
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
}

export default SchemeOverview;
