import React from 'react';
import { Generate } from '@jsonforms/core';
import { JsonFormsContainer, SelectOrCreate } from './BaseComponents';
import { listDirs, ROOT_DIR } from './Tools';
const fs = window.require('fs');
const path = require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") }


class EditScheme extends JsonFormsContainer {
    constructor(props) {
        super(props)
        this.type = props.type;
        this.name = props.name;
        this.schemeFile = path.join(typeDirs[this.type], this.name, this.name + '.yaml');
        this.dataStore = yaml.load(fs.readFileSync(this.schemeFile, 'utf-8'));
        this.dataStore.type = this.type;
        this.state.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'scheme.json'), 'utf-8'));
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
        for (var prop of this.state.uiSchema.elements) {
            if ('#/properties/type' === prop.scope)
                prop.rule = {
                    effect: "DISABLE",
                    condition: {
                        scope: prop.scope,
                        schema: {}
                    }
                }
        }
    }

    render() {
        return (
            <div>
                {this.buildJSONForm()}
                <div style={{ height: "1em" }} />
                <button type="button" disabled={!this.state.validState} onClick={(evt) => this.saveScheme()}>
                    Save
                </button>
                <div style={{ height: "0.5em" }} />
            </div>
        );
    }

    saveScheme() {
        try {
            var data = Object.assign({}, this.state.data);
            delete data.type;
            data = yaml.dump(data);
            fs.writeFileSync(this.schemeFile, data);
            alert("Saved to " + this.schemeFile);
        } catch {
            alert("Error while saving file.");
        }
    }
}

class SchemeOverview extends React.Component {
    constructor(props) {
        super(props)
        this.name = props.match.params.name;
        this.type = props.match.params.type;
        this.baseDir = path.join(typeDirs[this.type], this.name);
        this.state = { flavors: listDirs(this.baseDir) };
        this.history = props.history;
    }

    submitForm(name, create) {
        if (create === fs.existsSync(path.join(this.baseDir, name, name + ".yaml"))) {
            alert("Error. Unexpected existance or non-existance of flavor file.");
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.baseDir, name);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ['', 'bench', 'impl', 'param'].map(x => path.join(dir, x))
                    .filter(x => !fs.existsSync(x)).forEach(x => fs.mkdirSync(x));
                var data = { name: name };
                fs.writeFileSync(path.join(dir, name + ".yaml"), yaml.dump(data));
                alert('Flavor "' + name + '" was successfully created.');
            } catch {
                alert('Flavor "' + name + '" could not be created.');
            }

            this.setState({ flavors: listDirs(this.baseDir) });
            return;
        }
        var link = window.location.pathname + name + "/";
        this.history.push(link);
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <div className="App" style={{ marginTop: "1em" }}>
                <h2>Scheme Properties</h2>
                <EditScheme type={this.type} name={this.name} />
                <hr style={{ marginLeft: '-1em', marginRight: '-1em' }} />
                <h2>Flavours</h2>
                <SelectOrCreate schemes={this.state.flavors} addNew={false} action={(data) => this.submitForm(data.name, false)} />
                <SelectOrCreate schemes={this.state.flavors} addNew={true} action={(data) => this.submitForm(data.name, true)} />
            </div>
        );
    }
}

export default SchemeOverview;
