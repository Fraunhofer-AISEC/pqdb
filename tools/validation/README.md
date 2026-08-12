## Schema Validation
All data is stored in .yaml files which are validated using JSON Schema. The following steps describe how to the validation script can be executed locally.

### Requirements

* [Node.js](https://nodejs.org/) (tested with version 24)
* Yarn (Installs with node.js, if you use the snap package. Otherwise see [here](https://yarnpkg.com/getting-started/install))

### Install Dependencies

```
cd tools/validation
yarn install
```

### Running the validation

To run the validation, execute the following command from the project root:

`node tools/validation/validate.js`

To optionally generate the sqlite3 database which contains all pqdb data, you can add the target path as a command line argument:

`node tools/validation/validate.js /path/to/pqdb.sqlite`

An svg-image of the database scheme can be generated using the second command line argument:

`node tools/validation/validate.js /path/to/pqdb.sqlite /path/to/tables.svg`
