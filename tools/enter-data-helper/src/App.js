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
import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Alert, Container, Snackbar, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SelectScheme from './components/SelectScheme';
import SchemeOverview from './components/SchemeOverview';
import { FlavorOverview, SubtypeOverview } from './components/FlavorOverview';
import { NavBar, AppContext } from './components/BaseComponents';
import { checkRootDir, registerApp } from './components/Tools';
import './App.css';

function Layout() {
    return (
        <>
            <NavBar />
            <Outlet />
        </>
    );
}

const router = createHashRouter([
    {
        element: <Layout />,
        children: [
            { path: '/:type/:schemeIdentifier/:flavorIdentifier/:subType/:subIdentifier', element: <SubtypeOverview /> },
            { path: '/:type/:schemeIdentifier/:flavorIdentifier', element: <FlavorOverview /> },
            { path: '/:type/:schemeIdentifier', element: <SchemeOverview /> },
            { path: '/', element: <SelectScheme /> },
        ],
    },
]);

function getTheme(type) {
    return createTheme({
        palette: {
            mode: type,
            neutral: {
                main: '#2a0078',
                contrastText: '#fff',
            },
        },
    });
}

const themes = {
    'light': getTheme('light'),
    'dark': getTheme('dark')
}

class App extends React.Component {
    constructor(props) {
        super(props)
        this.foundRootDir = checkRootDir();
        registerApp(this);
        this.state = {
            alertOpen: false,
            alertMsg: "",
            alertSeverity: "info",
            themeId: "light"
        };
    }

    setTheme(id) {
        this.setState({ themeId: id });
    }

    openAlert(msg, severity) {
        this.setState({ alertOpen: true, alertMsg: msg, alertSeverity: severity });
    }

    closeAlert(event, reason) {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ alertOpen: false, alertMsg: "" });
    }

    render() {
        if (!this.foundRootDir) {
            return <h1>Required directories not found. Please specify the correct path to the repository as a command line argument.</h1>;
        }
        return (
            <ThemeProvider key={this.state.themeId} theme={themes[this.state.themeId]}>
                <AppContext.Provider value={{ themeId: this.state.themeId, setTheme: this.setTheme.bind(this) }}>
                    <CssBaseline />
                    <Container disableGutters maxWidth={false}>
                        <RouterProvider router={router} />
                        <Container>
                            <Snackbar key={this.state.alertMsg} autoHideDuration={6000}
                                open={this.state.alertOpen} onClose={this.closeAlert.bind(this)}>
                                <Alert onClose={this.closeAlert.bind(this)} severity={this.state.alertSeverity}>
                                    {this.state.alertMsg}
                                </Alert>
                            </Snackbar>
                        </Container>
                    </Container>
                </AppContext.Provider>
            </ThemeProvider>
        )
    }
}

export default App;
