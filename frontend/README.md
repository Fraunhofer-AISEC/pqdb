# PQDB Frontend

This is the frontend for displaying data from pqdb. The latest deployment of the frontend can be accessed at https://www.pqdb.info/.

## Testing locally


### Requirements

* Working schema validation script (For install instructions see [here](/tools/validation/README.md))
* Yarn (Installs with node.js, if you use the snap package. Otherwise see [here](https://yarnpkg.com/getting-started/install))

Before you can run the frontend locally you need to generate the SQLite database and the database diagram. This can be done by running the following command from the root directory of pqdb.
```
node tools/validation/validate.js frontend/public/pqdb.sqlite frontend/src/tables.svg
```
If you want to update the data source for the frontend, you need to remove the two files (`pqdb.sqlite`, `tables.svg`) and re-run the command.

### Installation
If not done already, switch to the `frontend` directory, then install the dependencies.

```
yarn install
```


### Run

```
yarn start
```

This starts the React app and loads the url (http://localhost:3000/) in the browser.
