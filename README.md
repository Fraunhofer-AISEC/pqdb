![PQDB Logo](misc/logo/pqdb-transparent.svg)
# Post-Quantum Cryptography Database
A comprehensive list of post-quantum crypto schemes and their properties.

## List of primitives

### KEM

#### Lattice-based
* [Frodo](encryption/frodo) ([Website](https://frodokem.org/))
* [Kyber](encryption/kyber) ([Website](https://pq-crystals.org/kyber/))
* [LAC](encryption/lac)
* [NewHope](encryption/newhope) ([Website](https://www.newhopecrypto.org/))
* [NTRU Prime](encryption/ntru-prime) ([Website](https://ntruprime.cr.yp.to/))
* [NTRU](encryption/ntru) ([Website](https://ntru.org/))
* [Round5](encryption/round5) ([Website](https://round5.org/))
* [ThreeBears](encryption/three-bears) ([Website](https://sourceforge.net/projects/threebears/))
* [SABER](encryption/saber) ([Website](https://www.esat.kuleuven.be/cosic/pqcrypto/saber/))


#### Isogeny-based
* [SIKE](encryption/sike) ([Website](https://sike.org/))

#### Code-based
* [BIKE](encryption/bike) ([Website](https://bikesuite.org/))
* [Classic McEliece](encryption/classic-mceliece) ([Website](https://classic.mceliece.org/index.html))
* [HQC](encryption/hqc) ([Website](https://pqc-hqc.org/))
* [LEDAcrypt](encryption/ledacrypt) ([Website](https://www.ledacrypt.org/))
* [ROLLO](encryption/rollo) ([Website](https://pqc-rollo.org/index.html))



### Signature

#### Lattice-based
* [Dilithium](signatures/dilithium) ([Website](https://pq-crystals.org/dilithium/))
* [qTESLA](signatures/qtesla) ([Website](https://qtesla.org/))
* [FALCON](signatures/falcon) ([Website](https://falcon-sign.info))
* [HAWK](signatures/hawk) ([Website](https://hawk-sign.info))

#### Multivariate
* [LUOV](signatures/luov) ([Website](https://www.esat.kuleuven.be/cosic/pqcrypto/luov/))
* [Rainbow](signatures/rainbow) ([Website](https://www.pqcrainbow.org/))
* [MQDSS](signatures/mqdss) ([Website](http://mqdss.org))
* [GeMSS](signatures/gemss) ([Website](https://www-polsys.lip6.fr/Links/NIST/GeMSS.html))
* [MAYO](signatures/mayo) ([Website](https://pqmayo.org/))
* [SNOVA](signatures/snova) ([Website](https://snova.pqclab.org))
* [UOV](signatures/uov) ([Website](https://www.uovsig.org/))
* [QR-UOV](signatures/qr-uov) ([Website](https://info.isl.ntt.co.jp/crypt/qruov/))

#### Hash-based
* [XMSS](signatures/xmss) ([Website](https://tools.ietf.org/html/rfc8391))
* [SPHINCS+](signatures/sphincs) ([Website](https://sphincs.org/))
* [LMS](signatures/lms)

#### Isogeny-based
* [SQIsign](signatures/sqisign) ([Website](https://sqisign.org))

#### MPC-in-the-Head
* [Picnic](signatures/picnic) ([Website](https://microsoft.github.io/Picnic/))
* [SDitH](signatures/sdith) ([Website](https://sdith.org/))
* [MQOM](signatures/mqom) ([Website](https://mqom.org))

#### Symmetric-based
* [FAEST](signatures/faest) ([Website](https://faest.info))

## Contribute

Please see [CONTRIBUTING](CONTRIBUTING.md).

Further documentation is also available for the various helper tools:
* [On schema validation](tools/validation/README.md)
* [On the enter-data-helper](tools/enter-data-helper/README.md)
* [On the frontend](frontend/README.md)

## Acknowledgments

This work was partly funded by the German Federal Ministry of Education and Research (BMBF) as part of the [FLOQI](https://floqi.org/) project (grant no. 16KIS1073) and the [KBLS](https://www.forschung-it-sicherheit-kommunikationssysteme.de/projekte/kbls) project (grant no. 16KIS1059K).
