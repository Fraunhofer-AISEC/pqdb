import React from 'react';
import { Generate } from '@jsonforms/core';
import { JsonFormsContainer, SelectOrCreate } from './BaseComponents';
import { Grid, Button, Paper, Box } from '@material-ui/core';
<<<<<<< HEAD
import { listFiles, ROOT_DIR } from './Tools';
=======
<<<<<<< HEAD
<<<<<<< Updated upstream
import { listFiles, ROOT_DIR, disableUIElements } from './Tools';
=======
import { listFiles, ROOT_DIR, disableUIElements, showAlert } from './Tools';
>>>>>>> Stashed changes
=======
import { listFiles, ROOT_DIR, disableUIElements, showAlert } from './Tools';
>>>>>>> master
>>>>>>> FALCON
const fs = window.require('fs');
const path = require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") };


class EditFlavor extends JsonFormsContainer {
    constructor(props) {
        super(props)
        this.type = props.type;
        this.schemeName = props.schemeName;
        this.name = props.name;
        this.flavorFile = path.join(typeDirs[this.type], this.schemeName, this.name, this.name + '.yaml');
        this.dataStore = yaml.load(fs.readFileSync(this.flavorFile, 'utf-8'));
        this.state.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'flavor.json'), 'utf-8'));
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
    }

    render() {
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item>
                    {this.buildJSONForm()}
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={(evt) => this.saveFlavor()}>
                        Save
                    </Button>
                </Grid>
            </Grid>
        );
    }

    saveFlavor() {
        try {
            var data = yaml.dump(this.state.data);
            fs.writeFileSync(this.flavorFile, data);
            alert("Saved to " + this.flavorFile);
        } catch {
            alert("Error while saving file.");
        }
    }
}

class SubtypeOverview extends JsonFormsContainer {
    constructor(props) {
        super(props)
        this.type = props.match.params.type;
        this.schemeName = props.match.params.schemeName;
        this.name = props.match.params.name;
        this.subType = props.match.params.subType;
        this.subName = props.match.params.subName;

        this.targetFile = path.join(typeDirs[this.type], this.schemeName, this.name, this.subType, this.subName + '.yaml');
        this.dataStore = yaml.load(fs.readFileSync(this.targetFile, 'utf-8'));
        this.state.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema',
            { 'bench': 'benchmark', 'param': 'paramset', 'impl': 'implementation' }[this.subType] + '.json')));
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
    }

    saveFile() {
        try {
<<<<<<< HEAD
            fs.writeFileSync(this.targetFile, yaml.dump(this.state.data));
            alert("Saved to " + this.targetFile);
=======
            fs.writeFileSync(this.targetFile, yaml.dump(data));
<<<<<<< HEAD
<<<<<<< Updated upstream
            alert("Saved to " + this.targetFile);
=======
            showAlert("Saved to " + this.targetFile, "success");
>>>>>>> Stashed changes
=======
            showAlert("Saved to " + this.targetFile, "success");
>>>>>>> master
>>>>>>> FALCON
        } catch {
            alert("Error while saving file.");
        }
    }

    render() {
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item>
                    <h2>{{ 'bench': 'Benchmark', 'param': 'Parameter Set', 'impl': 'Implementation' }[this.subType] + " Properties"}</h2>
                    {this.buildJSONForm()}
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={(evt) => this.saveFile()}>
                        Save
                    </Button>
                </Grid>
            </Grid>
        );
    }
}

class FlavorOverview extends React.Component {
    constructor(props) {
        super(props)
        this.schemeName = props.match.params.schemeName;
        this.name = props.match.params.name;
        this.type = props.match.params.type;
        this.baseDir = path.join(typeDirs[this.type], this.schemeName, this.name);
        this.state = {
            param: this.generateChoices('param'),
            impl: this.generateChoices('impl'),
            bench: this.generateChoices('bench')
        };

        this.benchRegex = '^(:?' + this.state.impl.join('|') + ')_(:?' + this.state.param.join('|') + ')_[A-Za-z0-9-]+$';
        this.history = props.history;
    }

    generateChoices(type) {
        return listFiles(path.join(this.baseDir, type))
            .filter(x => x.endsWith('.yaml')).map(x => x.substring(0, x.length - 5));
    }

    submitForm(name, type, create) {
        if (create === fs.existsSync(path.join(this.baseDir, type, name + ".yaml"))) {
            alert("Error. Unexpected existance or non-existance of flavor file.");
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.baseDir, type);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = (type === 'bench') ? { platform: name.split('_')[2] } : { name: name };
                fs.writeFileSync(path.join(dir, name + ".yaml"), yaml.dump(data));
                alert('"' + name + '" was successfully created.');
            } catch {
                alert('"' + name + '" could not be created.');
            }

            var newState = {};
            newState[type] = this.generateChoices(type);
            this.setState(newState);

            return;
        }

        this.history.push(window.location.pathname + type + '/' + name + '/');
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Flavor Properties</h2>
                            <EditFlavor type={this.type} schemeName={this.schemeName} name={this.name} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Parameter Sets</h2>
                            <SelectOrCreate schemes={this.state.param} addNew={false}
                                action={(data) => this.submitForm(data.name, "param", false)} />
                            <SelectOrCreate schemes={this.state.param} addNew={true}
                                action={(data) => this.submitForm(data.name, "param", true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Implementations</h2>
                            <SelectOrCreate schemes={this.state.impl} addNew={false}
                                action={(data) => this.submitForm(data.name, "impl", false)} />
                            <SelectOrCreate schemes={this.state.impl} addNew={true}
                                action={(data) => this.submitForm(data.name, "impl", true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Benchmarks</h2>
                            <SelectOrCreate schemes={this.state.bench} regex={this.benchRegex} addNew={false}
                                action={(data) => this.submitForm(data.name, "bench", false)} />
                            <SelectOrCreate schemes={this.state.bench} regex={this.benchRegex} addNew={true}
                                action={(data) => this.submitForm(data.name, "bench", true)} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

export { FlavorOverview, SubtypeOverview };
export default FlavorOverview;
