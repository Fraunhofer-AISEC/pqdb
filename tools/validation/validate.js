#!/usr/bin/env node

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

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Database = require('better-sqlite3');
const Ajv = require('ajv');
const addFormats = require("ajv-formats");
const ajv = new Ajv();
addFormats(ajv);

if (!exists('schema')) {
    console.error('Schema folder could not be found. Did you run the script from the root directory?');
    process.exit(1);
}

const schemaForScheme = JSON.parse(fs.readFileSync('schema/scheme.json', 'utf-8'));
const schemaForFlavor = JSON.parse(fs.readFileSync('schema/flavor.json', 'utf-8'));
const schemaForParam = JSON.parse(fs.readFileSync('schema/paramset.json', 'utf-8'));
const schemaForImpl = JSON.parse(fs.readFileSync('schema/implementation.json', 'utf-8'));;
const schemaForBench = JSON.parse(fs.readFileSync('schema/benchmark.json', 'utf-8'));;
const _validIdentifier = RegExp('^[-A-Za-z0-9]+$');

const TYPE_MAP = { "integer": "INTEGER", "number": "REAL", "string": "TEXT", "boolean": "INTEGER" };
const BASIC_TYPES = ["boolean", "integer", "number", "string"];

const ARRAY_COLUMN_NAMES = {
    "authors": "name", "links": "url", "sources": "url", "attacks": "url", "hardware features": "feature",
    "dependencies": "dependency", "patents sources": "url"
};
const SINGULAR = { "dependencies": "dependency" };

function singular(word) {
    if (word in SINGULAR)
        return SINGULAR[word];

    return word.substring(0, word.length - 1);
}

function convertName(name) {
    return name.replace(/[ |-]/g, "_");
}

function createTableForSchema(name, schema, additional_foreign_keys) {
    var tableInfos = tableInfoForSchema(name, schema, additional_foreign_keys);
    for (var name in tableInfos)
        db.prepare(sqlFromTableInfo(name, tableInfos[name])).run();
}

function sqlFromTableInfo(name, columnTypes) {
    return `CREATE TABLE ${name} (id INTEGER PRIMARY KEY,id_text TEXT,${columnTypes.join(",")});`;
}

// Supported: String, Integer, Number, Boolean, Array (in root object)
function tableInfoForSchema(name, schema, additional_foreign_keys) {
    var tables = {};
    tables[name] = extractColTypes(schema);
    for (var target of additional_foreign_keys) {
        tables[name].push(`${target}_id INTEGER REFERENCES ${target}(id)`);
    }

    var properties = schema.properties;
    for (var key in properties) {
        if (properties[key].type === "array") {
            var tableName = `${name}_${singular(convertName(key))}`;
            if (properties[key].items.type === "object") {
                tables[tableName] = extractColTypes(properties[key].items);
            } else if (BASIC_TYPES.includes(properties[key].items.type)) {
                tables[tableName] = [`${ARRAY_COLUMN_NAMES[key]} ${TYPE_MAP[properties[key].items.type]}`];
            } else {
                throw `Error in schema '${name}.${key}': Unsupported type '${properties[key].items.type}' in array`;
            }
            tables[tableName].push(`${name}_id INTEGER REFERENCES ${name}(id)`);
        }
    }

    return tables;
}

function extractColTypes(schema) {
    var columnTypes = [];
    var properties = schema.properties;
    for (var key in properties) {
        if (BASIC_TYPES.includes(properties[key].type)) {
            columnTypes.push(`${convertName(key)} ${TYPE_MAP[properties[key].type]}`);
        } else if (properties[key].type === "object") {
            var namePrefix = `${convertName(key)}_`;
            var objColumnTypes = extractColTypes(properties[key]);
            for (var i = 0; i < objColumnTypes.length; i++) {
                columnTypes.push(namePrefix + objColumnTypes[i]);
            }
        }
    }

    return columnTypes;
}

function extractArrayColData(obj, name, parent_id) {
    var colData = {};
    for (var key in obj) {
        if (typeof obj[key] != "object" || !Array.isArray(obj[key]) || obj[key].length == 0)
            continue;
        var tableName = `${name}_${singular(convertName(key))}`;
        if (typeof obj[key][0] === "object") {
            colData[tableName] = obj[key].map(item => {
                var [col, dat] = extractColData(item);
                col.push(`${name}_id`);
                dat.push(parent_id);
                return [col, dat];
            });
        } else {
            var colName = ARRAY_COLUMN_NAMES[key];
            colData[tableName] = obj[key].map(item => [[colName, `${name}_id`], [convertValue(item), parent_id]]);
        }
    }

    return colData;
}

function convertValue(value) {
    if (typeof value === "boolean") return value ? 1 : 0;
    return value;
}

function extractColData(obj) {
    var columns = [];
    var data = [];
    for (var key in obj) {
        if (BASIC_TYPES.includes(typeof obj[key])) {
            columns.push(convertName(key));
            data.push(convertValue(obj[key]));
        } else if (typeof obj[key] === "object") {
            if (Array.isArray(obj[key])) continue;

            var namePrefix = `${convertName(key)}_`;
            var [objColumns, objData] = extractColData(obj[key]);
            for (var i = 0; i < objColumns.length; i++) {
                columns.push(namePrefix + objColumns[i]);
                data.push(objData[i]);
            }
        } else {
            console.log(`${(typeof obj[key])} is currently skipped.`);
        }
    }
    return [columns, data];
}

function insertColData(tableName, columns, data) {
    var sql = `INSERT INTO ${tableName}(${columns.join(",")}) VALUES (${columns.map(col => "?").join(",")})`;
    var stmt = db.prepare(sql);
    var result = stmt.run(data);
    return result.lastInsertRowid;
}

function exists(file) {
    try {
        fs.accessSync(file, fs.constants.F_OK);
    } catch (err) {
        if (err.code == 'ENOENT')
            return false;
        else
            throw err;
    }
    return true;
}

function isValidSchemeDir(rootDirectory, directory) {
    var fullPath = path.join(rootDirectory, directory);
    console.log(fullPath);

    var schemeFile = path.join(fullPath, `${directory}.yaml`);
    if (!exists(schemeFile)) {
        console.error(`Scheme file ${schemeFile} is not present.`);
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

    // Insert scheme into database
    var [columns, data] = extractColData(scheme);
    columns.push('id_text');
    data.push(directory);
    var schemeID = insertColData("scheme", columns, data);
    var arrayColData = extractArrayColData(scheme, "scheme", schemeID);

    for (var tableName in arrayColData)
        for (var [columns, data] of arrayColData[tableName])
            insertColData(tableName, columns, data);

    // Validate flavors
    return fs.readdirSync(fullPath).every(
        flavorDir => !fs.statSync(path.join(fullPath, flavorDir)).isDirectory()
            || isValidFlavorDir(fullPath, flavorDir, schemeID)
    );
}

function isValidFlavorDir(rootDirectory, directory, schemeID) {
    var fullPath = path.join(rootDirectory, directory);
    console.log(fullPath);

    var flavorFile = path.join(fullPath, `${directory}.yaml`);
    if (!exists(flavorFile)) {
        console.error(`Flavor file ${flavorFile} is not present.`);
        return false;
    }
    var flavorID = validateFileAndInsert(flavorFile, schemaForFlavor, "flavor", "scheme", schemeID, directory);
    if (flavorID == 0) return false;

    // Validate paramsets, implementations
    var schemaForDir = {
        "param": schemaForParam,
        "impl": schemaForImpl
    };

    var schemaNameForDir = {
        "param": "paramset",
        "impl": "implementation"
    };

    var paramImplIDs = { "param": {}, "impl": {} };

    for (var directory in schemaForDir) {
        if (!exists(path.join(fullPath, directory)))
            continue;
        for (var file of fs.readdirSync(path.join(fullPath, directory))) {
            if (!fs.statSync(path.join(fullPath, directory, file)).isFile() || !file.endsWith(".yaml"))
                continue;
            var id_text = path.basename(file, '.yaml');
            var id = validateFileAndInsert(
                path.join(fullPath, directory, file), schemaForDir[directory],
                schemaNameForDir[directory], "flavor", flavorID, id_text
            );
            if (id == 0) return false;
            paramImplIDs[directory][file.substring(0, file.length - 5)] = id;
        }
    }

    // Validate benchmarks
    return !exists(path.join(fullPath, "bench")) || fs.readdirSync(path.join(fullPath, "bench")).every(
        file => !fs.statSync(path.join(fullPath, "bench", file)).isFile()
            || !file.endsWith(".yaml")
            || validateBenchmarkFileAndInsert(fullPath, file, paramImplIDs)
    );
}

function validateBenchmarkFileAndInsert(fullPath, file, paramImplIDs) {
    var filePath = path.join(fullPath, "bench", file);
    console.log(filePath);
    var parts = path.basename(file, '.yaml').split('_');
    var data = yaml.load(fs.readFileSync(filePath));
    if ('impl' in data || 'param' in data) {
        console.log("'impl' and 'param' should not be explicity set in benchmark files but are inferred from the filename.");
        return false;
    }
    if (parts.length != 3 || !parts.every(p => _validIdentifier.test(p))) {
        console.log("Filename must be impl_param_arch.yaml and each segment must match A-Za-z0-9-.");
        return false;
    }
    data.impl = parts[0];
    if (!exists(path.join(fullPath, 'impl', `${data.impl}.yaml`))) {
        console.log(`Referenced implementation '${data.impl}' does not exist.`);
        return false;
    }
    data.param = parts[1];
    if (!exists(path.join(fullPath, 'param', `${data.param}.yaml`))) {
        console.log(`Referenced parameter set '${data.param}' does not exist.`);
        return false;
    }
    if (!isValidData(data, schemaForBench)) return false;

    var paramID = paramImplIDs["param"][data.param];
    var implID = paramImplIDs["impl"][data.impl];
    delete data.impl;
    delete data.param;

    return insertData(data, "benchmark", ["paramset", "implementation"], [paramID, implID], file) > 0;
}

function validateFileAndInsert(file, schema, schemaName, parentName, parentID, id_text) {
    console.log(file);
    if (!_validIdentifier.test(path.basename(file, '.yaml'))) {
        console.log("Filename must match A-Za-z0-9-!");
        return 0;
    }
    var obj = yaml.load(fs.readFileSync(file));
    if (isValidData(obj, schema))
        return insertData(obj, schemaName, [parentName], [parentID], id_text);

    return 0;
}

function insertData(obj, schemaName, parentNames, parentIDs, id_text) {
    var [columns, data] = extractColData(obj);
    for (var i = 0; i < parentNames.length; i++) {
        columns.push(`${parentNames[i]}_id`);
        data.push(parentIDs[i]);
    }
    columns.push('id_text');
    data.push(id_text);

    var schemaID = insertColData(schemaName, columns, data);
    var arrayColData = extractArrayColData(obj, schemaName, schemaID);
    for (var tableName in arrayColData)
        for (var [columns, data] of arrayColData[tableName])
            insertColData(tableName, columns, data);
    return schemaID;
}

function isValidData(data, schema) {
    var isValid = ajv.compile(schema);
    if (!isValid(data)) {
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

var argv = process.argv.slice(2);

var dbFile = ":memory:";
if (argv.length > 0 && argv.length < 3) dbFile = argv[0];
var dbSchemaSvg = (argv.length == 2) ? dbSchemaSvg = argv[1] : null;
var db = new Database(dbFile);

createTableForSchema("scheme", schemaForScheme, []);
createTableForSchema("flavor", schemaForFlavor, ["scheme"]);
createTableForSchema("paramset", schemaForParam, ["flavor"]);
createTableForSchema("implementation", schemaForImpl, ["flavor"]);
var schemaForBenchReduced = JSON.parse(JSON.stringify(schemaForBench));
delete schemaForBenchReduced.properties.impl;
delete schemaForBenchReduced.properties.param;
delete schemaForBenchReduced.required;
createTableForSchema("benchmark", schemaForBenchReduced, ["paramset", "implementation"]);

if (!validate()) process.exit(1);

if (dbSchemaSvg != null) {
    const nomnoml = require('nomnoml');
    var tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%'"
    ).all().map(row => row.name);
    var tableInfo = {};
    tables.forEach(table => tableInfo[table] = db.pragma(`table_info(${table})`));
    var foreignKeyInfo = {};
    tables.forEach(table => foreignKeyInfo[table] = db.pragma(`foreign_key_list(${table})`));

    var source = "#title: PQDB Database Diagram\n";
    // Add tables
    source += tables.map(table => `[${table}|` +
        tableInfo[table].map(info => `${info.name}: ${info.type} ${((info.pk === 1) ? " 🔑" : "")}`).join(";") +
        "]").join("\n");
    source += "\n";
    // Add foreign key connectors
    source += tables.filter(table => foreignKeyInfo[table].length > 0).map(
        table => foreignKeyInfo[table].map(info => `[${table}] -> [${info.table}]`).join("\n")
    ).join("\n");
    // Render svg
    var svgData = nomnoml.renderSvg(source);
    // Add white background color
    svgData = svgData.replace('</desc>\n', '</desc>\n  <rect width="100%" height="100%" fill="white"/>\n');

    // Write to file
    fs.writeFileSync(dbSchemaSvg, svgData);
}

db.close();

console.log("Validation and building the database successfully completed.");
