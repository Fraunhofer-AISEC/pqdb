import React from 'react';
import { Generate } from '@jsonforms/core';
import { JsonFormsContainer, SelectOrCreate } from './BaseComponents';
import { listFiles, ROOT_DIR } from './Tools';
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
            <div>
                {this.buildJSONForm()}
                <div style={{ height: "1em" }} />
                <button type="button" disabled={!this.state.validState} onClick={(evt) => this.saveFlavor()}>
                    Save
                </button>
                <div style={{ height: "0.5em" }} />
            </div>
        );
    }

    saveFlavor() {
        try {
            var data = Object.assign({}, this.state.data);
            delete data.type;
            data = yaml.dump(data);
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
            fs.writeFileSync(this.flavorFile, yaml.dump(this.state.data));
            alert("Saved to " + this.targetFile);
        } catch {
            alert("Error while saving file.");
        }
    }

    render() {
        return (
            <div className="App" style={{ marginTop: "1em" }}>
                <h2>{{ 'bench': 'Benchmark', 'param': 'Parameter Set', 'impl': 'Implementation' }[this.subType] + " Properties"}</h2>
                {this.buildJSONForm()}
                <div style={{ height: "1em" }} />
                <button type="button" disabled={!this.state.validState} onClick={(evt) => this.saveFile()}>
                    Save
                </button>
            </div>
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
            <div className="App" style={{ marginTop: "1em" }}>
                <h2>Flavor Properties</h2>
                <EditFlavor type={this.type} schemeName={this.schemeName} name={this.name} />
                <hr style={{ marginLeft: '-1em', marginRight: '-1em' }} />
                <h2>Parameter Sets</h2>
                <SelectOrCreate schemes={this.state.param} addNew={false}
                    action={(data) => this.submitForm(data.name, "param", false)} />
                <SelectOrCreate schemes={this.state.param} addNew={true}
                    action={(data) => this.submitForm(data.name, "param", true)} />
                <hr style={{ marginLeft: '-1em', marginRight: '-1em' }} />
                <h2>Implementations</h2>
                <SelectOrCreate schemes={this.state.impl} addNew={false}
                    action={(data) => this.submitForm(data.name, "impl", false)} />
                <SelectOrCreate schemes={this.state.impl} addNew={true}
                    action={(data) => this.submitForm(data.name, "impl", true)} />
                <hr style={{ marginLeft: '-1em', marginRight: '-1em' }} />
                <h2>Benchmarks</h2>
                <SelectOrCreate schemes={this.state.bench} regex={this.benchRegex} addNew={false}
                    action={(data) => this.submitForm(data.name, "bench", false)} />
                <SelectOrCreate schemes={this.state.bench} regex={this.benchRegex} addNew={true}
                    action={(data) => this.submitForm(data.name, "bench", true)} />
            </div>
        );
    }
}

export { FlavorOverview, SubtypeOverview };
export default FlavorOverview;
