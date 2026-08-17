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
import { JsonForms, JsonFormsDispatch } from '@jsonforms/react';
import { Generate, schemaMatches, rankWith, resolveSchema } from '@jsonforms/core';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import {
    Tooltip, Grid, Button, AppBar, Toolbar, IconButton, Link, Breadcrumbs, Typography, ButtonGroup, Box,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper
} from '@mui/material';
import {
    Info as InfoIcon, ArrowBack as BackIcon, Home as HomeIcon, ArrowForward as ForwardIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation, useBlocker } from 'react-router-dom';
import { showAlert, getUserConfirmation } from './Tools';
const yaml = require('js-yaml');
const fs = window.require('fs');
const remote = window.require('@electron/remote');

export const AppContext = React.createContext(null);

class TooltipWrapper extends React.Component {
    constructor(props) {
        super(props);
        const { schema, uischema } = props;
        const subSchema = resolveSchema(schema, uischema && uischema.scope);
        this.comment = subSchema ? subSchema["$comment"] : undefined;
    }

    render() {
        return (
            <Grid container direction="row" alignItems="center" spacing={1}>
                <Grid item xs>
                    <JsonFormsDispatch
                        uischema={this.props.uischema}
                        schema={this.props.schema}
                        path={this.props.path}
                        renderers={materialRenderers} /*need to use renderers in which this wrapper is not included*/
                    />
                </Grid>
                {this.comment != null ? (
                    <Grid item>
                        <Tooltip arrow placement="left" title={this.comment}>
                            <InfoIcon />
                        </Tooltip>
                    </Grid>
                ) : null}
            </Grid>
        );
    }
};

const LinkRouter = props => <Link color="inherit" {...props} component={RouterLink} />;

function NavBar() {
    const { themeId, setTheme } = React.useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();
    const currentLocation = location.pathname;

    var path = currentLocation.substring(1, currentLocation.length - 1).split('/');
    var pathLinks = [['/', "Home"]];
    if (path.length >= 2 && path[0] !== '') {
        var text1 = path.slice(0, 2).join("/");
        var link1 = '/' + text1 + '/';
        pathLinks.push([link1, text1]);
    }
    if (path.length >= 3) {
        var text2 = path[2];
        var link2 = '/' + path.slice(0, 3).join("/") + '/';
        pathLinks.push([link2, text2]);
    }
    if (path.length === 5) {
        var text3 = path.slice(3, 5).join("/");
        var link3 = '/' + path.join('/') + '/';
        pathLinks.push([link3, text3]);
    }

    var last = pathLinks.length - 1;

    return (
        <AppBar position="sticky" color="neutral">
            <Toolbar>
                {
                    (pathLinks.length > 1) ?
                        <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
                            <BackIcon />
                        </IconButton>
                        :
                        <IconButton edge="start" color="inherit">
                            <HomeIcon />
                        </IconButton>
                }

                <Breadcrumbs color="Menu">
                    {pathLinks.slice(0, last).map(x => <LinkRouter key={x[0]} to={x[0]}>{x[1]}</LinkRouter>)}
                    {<Typography>{pathLinks[last][1]}</Typography>}
                </Breadcrumbs>
                <Box sx={{ flex: 1 }} />
                <ButtonGroup color="primary">
                    <Button
                        variant={themeId === 'light' ? "contained" : "outlined"}
                        onClick={() => setTheme('light')}>Light</Button>
                    <Button
                        variant={themeId === 'dark' ? "contained" : "outlined"}
                        onClick={() => setTheme('dark')}>Dark</Button>
                </ButtonGroup>
            </Toolbar>
        </AppBar>
    );
}

const quitQuestion = "Discard changes?"

function NavigationBlocker({ when, message }) {
    const blocker = useBlocker(when);
    const handledRef = React.useRef(false);

    React.useEffect(() => {
        if (blocker.state === 'blocked' && !handledRef.current) {
            handledRef.current = true;
            getUserConfirmation(message, (answer) => {
                handledRef.current = false;
                if (answer) blocker.proceed();
                else blocker.reset();
            });
        }
    }, [blocker, message, when]);

    React.useEffect(() => {
        if (blocker.state === 'blocked' && !when) {
            blocker.reset();
        }
    }, [blocker, when]);

    return null;
}

class EditFile extends React.Component {
    constructor(props) {
        super(props);
        this.initialData = props.initialData ?? yaml.load(fs.readFileSync(props.filePath, 'utf-8'));
        this.schema = props.schema;
        this.state = { errors: null, data: this.initialData, savedData: this.initialData, dataChanged: false };
    }

    onChange({ errors, data }) {
        var dataChanged = JSON.stringify(data) !== JSON.stringify(this.initialData);
        this.setQuitHook(dataChanged);
        this.setState({
            validState: errors && errors.length === 0, data: data,
            dataChanged: dataChanged
        });
    }

    setQuitHook(dataChanged) {
        window.onbeforeunload = dataChanged ? function (e) {
            e.returnValue = !dataChanged;
            getUserConfirmation(quitQuestion, (quit) => { if (quit) remote.getCurrentWindow().destroy() });
        } : (e) => { };
    }

    saveFile() {
        try {
            var data = Object.assign({}, this.state.data);
            if (this.props.onPreSave) this.props.onPreSave(data);
            data = yaml.dump(data);
            fs.writeFileSync(this.props.filePath, data);
            this.setQuitHook(false);
            this.setState({savedData: this.state.data, dataChanged: false});
            showAlert("Saved to " + this.props.filePath, "success");
        } catch {
            showAlert("Error while saving file.", "error");
        }
    }

    render() {
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item>
                    <JsonFormsContainer schema={this.props.schema} uiSchema={this.props.uiSchema}
                        initialData={this.initialData} onChange={(content) => this.onChange(content)} />
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained"
                        disabled={!this.state.validState} onClick={() => this.saveFile()}>
                        Save
                    </Button>
                    { this.state.validState ? null : <span style={{ marginLeft:"1em", opacity:.6, textColor:"red" }}>You cannot save because there still are errors in the data.</span> }
                </Grid>
                <NavigationBlocker when={this.state.dataChanged} message={quitQuestion} />
            </Grid>
        );
    }
}

class JsonFormsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.initialData = props.initialData ?? {};
        this.uiSchema = props.uiSchema ?? Generate.uiSchema(props.schema);
    }

    render() {
        return (
            <JsonForms
                schema={this.props.schema}
                uischema={this.uiSchema}
                renderers={[
                    ...materialRenderers,
                    {
                        tester: rankWith(5, schemaMatches((schema) => "$comment" in schema)),
                        renderer: TooltipWrapper
                    }
                ]}
                cells={materialCells}
                data={this.initialData}
                onChange={(content) => this.props.onChange(content)}
            />
        );
    }
}

class SelectList extends React.Component {
    render() {
        return (
            <Paper>
                <List component="ul">
                    {
                        this.props.entries.map(entry => (
                            <ListItem key={"item-" + entry} disablePadding>
                                <ListItemButton onClick={() => this.props.action(entry)}>
                                    <ListItemText primary={entry} />
                                    <ListItemIcon>
                                        <ForwardIcon />
                                    </ListItemIcon>
                                </ListItemButton>
                            </ListItem>
                        ))
                    }
                </List>
            </Paper>
        );
    }
}

class SelectOrCreate extends React.Component {
    constructor(props) {
        super(props);
        if (props.regex != null)
            this.regex = props.regex;
        else
            this.regex = "^[A-Za-z0-9-]+$";

        this.addNew = props.addNew;
        this.action = props.action;
        this.buttonText = (this.addNew) ? "Create" : "Select";

        this.state = { errors: null, data: null };
        this.schema = {
            type: "object", properties: {
                identifier: {
                    type: "string",
                    title: "Identifier (short name used as file name)",
                    pattern: this.regex
                }
            }, required: ["identifier"]
        };
    }

    updateSchema() {
        delete this.schema.properties.identifier.not;
        delete this.schema.properties.identifier.enum;
        if (this.addNew && this.props.schemes.length > 0)
            this.schema.properties.identifier.not = { type: "string", enum: this.props.schemes };
        else if (!this.addNew)
            this.schema.properties.identifier.enum = this.props.schemes;
    }

    onChange({ errors, data }) {
        this.setState({ validState: errors && errors.length === 0, data: data });
    }

    render() {
        if (this.props.schemes.length === 0 && !this.addNew)
            return null;

        this.updateSchema();
        return (
            <Grid container direction="row" alignItems="center" spacing={1}>
                <Grid item xs>
                    <JsonFormsContainer key={JSON.stringify(this.props.schemes)}
                        schema={this.schema} onChange={(content) => this.onChange(content)} />
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={() => this.action(this.state.data)}>
                        {this.buttonText}
                    </Button>
                </Grid>
            </Grid>
        );
    }
}

export default JsonFormsContainer;
export { JsonFormsContainer, SelectOrCreate, SelectList, NavBar, EditFile };
