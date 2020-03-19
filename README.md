# pqdb
A comprehensive list of post-quantum crypto schemes and their properties

## Schema Validation
All data is stored in .yaml files which are validated using JSON Schema. The following steps describe how to the validation script can be executed locally.

### Install Dependencies

[Node.js](https://nodejs.org/) is required to run the validation. If you haven't already, you can install it using the snap package (or any other way you prefer).

`sudo snap install node --classic`

Now you can install all the remaining dependencies:

```
cd tools/validation
npm install
```
### Running the validation

To run the validation, execute the following command from the project root:

`node tools/validation/validate.js`


## Contribute
If you want to contribute data, you can either create the required yaml files manually or use our helper tool which is located under [tools/enter-data-helper](tools/enter-data-helper).
