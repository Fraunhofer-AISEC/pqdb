## Schema Validation
All data is stored in .yaml files which are validated using JSON Schema. The following steps describe how to the validation script can be executed locally. [Node.js](https://nodejs.org/) is required to run the validation (tested with version 12.x). Currently, we don't recommend the snap package since there have been issues with the dependencies.

### Install Dependencies

```
cd tools/validation
npm install
```

### Running the validation

To run the validation, execute the following command from the project root:

`node tools/validation/validate.js`

To optionally generate the sqlite3 database which contains all pqdb data, you can add the target path as a command line argument:

`node tools/validation/validate.js /path/to/pqdb.sqlite`

An svg-image of the database scheme can be generated using the second command line argument:

`node tools/validation/validate.js /path/to/pqdb.sqlite /path/to/tables.svg`
