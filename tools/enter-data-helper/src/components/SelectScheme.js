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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelectOrCreate, SelectList } from './BaseComponents';
import { listDirs, ROOT_DIR, showAlert } from './Tools';
import { Box, Grid, Paper } from '@mui/material';
const fs = window.require('fs');
const path = window.require('path');
const yaml = require('js-yaml')

const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") };

function SelectScheme() {
    const [enc, setEnc] = useState(listDirs(typeDirs['enc']));
    const [sig, setSig] = useState(listDirs(typeDirs['sig']));
    const navigate = useNavigate();

    function submitForm(type, identifier, create) {
        if (create === fs.existsSync(path.join(typeDirs[type], identifier, identifier + ".yaml"))) {
            showAlert("Error. Unexpected existance or non-existance of scheme file.", "error");
            return;
        }

        if (create) {
            try {
                var dir = path.join(typeDirs[type], identifier);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = {};
                fs.writeFileSync(path.join(dir, identifier + ".yaml"), yaml.dump(data));
                showAlert('Scheme "' + identifier + '" was successfully created.', 'success');
            } catch {
                showAlert('Scheme "' + identifier + '" could not be created.', 'error');
            }

            if (type === 'enc') setEnc(listDirs(typeDirs[type]));
            else setSig(listDirs(typeDirs[type]));

            return;
        }

        navigate('/' + type + '/' + identifier + '/');
        window.scrollTo(0, 0);
    }

    return (
        <Grid container direction="column" spacing={3}>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Encryption Schemes</h2>
                        <SelectList entries={enc}
                            action={(identifier) => submitForm("enc", identifier, false)} />
                        <SelectOrCreate schemes={enc} addNew={true}
                            action={(data) => submitForm("enc", data.identifier, true)} />
                    </Box>
                </Paper>
            </Grid>
            <Grid item>
                <Paper>
                    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                        <h2>Signature Schemes</h2>
                        <SelectList entries={sig}
                            action={(identifier) => submitForm("sig", identifier, false)} />
                        <SelectOrCreate schemes={sig} addNew={true}
                            action={(data) => submitForm("sig", data.identifier, true)} />
                    </Box>
                </Paper>
            </Grid>
        </Grid >
    );
}

export default SelectScheme;
