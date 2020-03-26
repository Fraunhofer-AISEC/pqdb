# pqdb
A comprehensive list of post-quantum crypto schemes and their properties

## List of primitives

### KEM
* [Frodo](encryption/frodo) ([Website](https://frodokem.org/))
* [Kyber](encryption/kyber) ([Website](https://pq-crystals.org/kyber/))
* [NewHope](encryption/newhope) ([Website](https://www.newhopecrypto.org/))
* [NTRU Prime](encryption/ntru-prime) ([Website](https://ntruprime.cr.yp.to/))

### Signature
* [qTESLA](signatures/qTESLA) ([Website](https://www.isara.com/resource-center/qtesla.html))

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
