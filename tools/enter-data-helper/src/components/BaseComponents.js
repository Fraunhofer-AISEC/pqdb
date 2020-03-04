import React from 'react';
import { JsonForms } from '@jsonforms/react';
import { Generate } from '@jsonforms/core';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { Link } from 'react-router-dom';


class NavBar extends React.Component {
    constructor(props) {
        super(props);
        this.history = props.history;
        this.state = { location: '/' };
    }

    componentDidMount() {
        this.unlisten = this.history.listen((location, action) => {
            this.setState({ location: window.location.pathname });
        });
    }
    componentWillUnmount() {
        this.unlisten();
    }

    render() {
        var s = window.location.pathname;
        var path = s.substring(1, s.length - 1).split('/');
        var pathLinks = [<td key='/'><Link to='/'>/</Link></td>];
        if (path.length >= 2 && path[0] !== '') {
            var text1 = path.slice(0, 2).join("/") + '/';
            var link1 = '/' + text1;
            pathLinks.push(<td key={link1}><Link to={link1}>{text1}</Link></td>)
        }
        if (path.length >= 3) {
            var text2 = path[2] + '/';
            var link2 = '/' + path.slice(0, 3).join("/") + '/';
            pathLinks.push(<td key={link2}><Link to={link2}>{text2}</Link></td>)
        }
        if (path.length === 5) {
            var text3 = path.slice(3, 5).join("/") + '/';
            var link3 = '/' + path.join('/') + '/';
            pathLinks.push(<td key={link3}><Link to={link3}>{text3}</Link></td>)
        }

        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <table style={{ padding: '0.5em' }}>
                    <tbody>
                        <tr key={this.state.location}>
                            <td><button onClick={(evt) => this.history.goBack()}>Go back</button></td>
                            {pathLinks}
                        </tr>
                    </tbody>
                </table>
            </nav>
        );
    }
}

class JsonFormsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { validState: false, data: {}, schema: {}, uiSchema: {} };
        this.dataStore = {};
    }

    buildJSONForm() {
        return (
            <JsonForms
                schema={this.state.schema}
                uischema={this.state.uiSchema}
                renderers={materialRenderers}
                cells={materialCells}
                data={this.dataStore}
                onChange={this.onChange.bind(this)}
            />
        );
    }

    onChange({ errors, data }) {
        this.setState({ validState: errors && errors.length === 0, data: data });
    }
}

class SelectOrCreate extends JsonFormsContainer {
    constructor(props) {
        super(props);
        if (props.regex != null)
            this.regex = props.regex;
        else
            this.regex = "^[A-Za-z0-9-]+$";

        this.addNew = props.addNew;
        this.action = props.action;
        this.buttonText = (this.addNew) ? "Create" : "Select";

        this.state.schema = this.generateSchema();
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
        this.state.schemes = props.schemes;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.schemes !== this.props.schemes) {
            var schema = this.generateSchema();
            this.setState({ schema: schema, uiSchema: Generate.uiSchema(schema), schemes: this.props.schemes });
        }
    }

    generateSchema() {
        var schema = {
            type: "object", properties: {
                name: {
                    type: "string",
                    pattern: this.regex
                }
            }, required: ["name"]
        };
        if (this.addNew && this.props.schemes.length > 0)
            schema.properties.name.not = { type: "string", enum: this.props.schemes };
        else if (!this.addNew)
            schema.properties.name.enum = this.props.schemes;

        return schema;
    }

    render() {
        if (this.state.schemes.length === 0 && !this.addNew)
            return null;

        return (
            <div style={{ marginBottom: "1em" }}>
                <div style={{ display: "inline-block", width: "80%", verticalAlign: "middle" }}>
                    {this.buildJSONForm()}
                </div>
                <div style={{ display: "inline-block", width: "3%" }} />
                <button style={{ display: "inline-block", width: "17%", verticalAlign: "middle" }}
                    type="button" disabled={!this.state.validState} onClick={(evt) => this.action(this.state.data)}>
                    {this.buttonText}
                </button>
            </div>
        );
    }
}

export default JsonFormsContainer;
export { JsonFormsContainer, SelectOrCreate, NavBar };
