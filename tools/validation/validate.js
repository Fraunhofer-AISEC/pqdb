const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml')
const Ajv = require('ajv');
const ajv = new Ajv();

if (!exists('schema')) {
    console.error('Schema folder could not be found. Did you run the script from the root directory?');
    process.exit(1);
}

const schemaForScheme = JSON.parse(fs.readFileSync('schema/scheme.json', 'utf-8'));
const schemaForFlavor = JSON.parse(fs.readFileSync('schema/flavor.json', 'utf-8'));
const schemaForParam = JSON.parse(fs.readFileSync('schema/paramset.json', 'utf-8'));
const schemaForImpl = JSON.parse(fs.readFileSync('schema/implementation.json', 'utf-8'));;
const schemaForBench = JSON.parse(fs.readFileSync('schema/benchmark.json', 'utf-8'));;


function exists(file) {
    try {
        fs.accessSync(file, 'fs.constants.F_OK');
    } catch {
        return false;
    }
    return true;
}

function isValidSchemeDir(rootDirectory, directory) {
    var fullPath = path.join(rootDirectory, directory);
    console.log(fullPath);

    var schemeFile = path.join(fullPath, directory + '.yaml');
    if (!exists(schemeFile)) {
        console.error('Scheme file ' + schemeFile + ' is not present.');
        return false;
    }

    console.log(schemeFile);
    var scheme = yaml.load(fs.readFileSync(schemeFile));
    scheme.type = (rootDirectory.endsWith('encryption')) ? 'enc' : 'sig';

    var isValidScheme = ajv.compile(schemaForScheme);
    if (!isValidScheme(scheme)) {
        console.error(isValidScheme.errors);
        return false;
    }

    return fs.readdirSync(fullPath).every(
        flavorDir => !fs.statSync(path.join(fullPath, flavorDir)).isDirectory()
            || isValidFlavorDir(fullPath, flavorDir)
    );
}

function isValidFlavorDir(rootDirectory, directory) {
    var fullPath = path.join(rootDirectory, directory);
    console.log(fullPath);

    var flavorFile = path.join(fullPath, directory + '.yaml');
    if (!exists(flavorFile)) {
        console.error('Flavor file ' + flavorFile + ' is not present.');
        return false;
    }
    if (!isValidFile(flavorFile, schemaForFlavor)) return false;

    var schemaForDir = {
        "param": schemaForParam,
        "impl": schemaForImpl,
        "bench": schemaForBench
    };

    return Object.keys(schemaForDir).every(
        directory => !exists(path.join(fullPath, directory))
            || fs.readdirSync(path.join(fullPath, directory)).every(
                file => !fs.statSync(path.join(fullPath, directory, file)).isFile()
                    || !file.endsWith(".yaml")
                    || isValidFile(path.join(fullPath, directory, file), schemaForDir[directory])
            )
    );
}

function isValidFile(file, schema) {
    console.log(file);
    var isValid = ajv.compile(schema);
    if (!isValid(yaml.load(fs.readFileSync(file)))) {
        console.error(isValid.errors);
        return false;
    }
    return true;
}

function validate() {
    return ['encryption', 'signatures'].every(
        rootDir => fs.readdirSync(rootDir).every(
            schemeDir => !fs.statSync(path.join(rootDir, schemeDir)).isDirectory()
                || isValidSchemeDir(rootDir, schemeDir)
        )
    );
}

if (!validate()) process.exit(1);
console.log("Validation successfully completed. All files are valid.")
