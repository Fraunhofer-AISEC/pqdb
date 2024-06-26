# ![PQDB Logo](misc/logo/pqdb-transparent.png)
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
* [BIKE](encryption/BIKE) ([Website](https://bikesuite.org/))
* [Classic McEliece](encryption/classic-mceliece) ([Website](https://classic.mceliece.org/index.html))
* [HQC](encryption/hqc) ([Website](https://pqc-hqc.org/))
* [LEDAcrypt](encryption/ledacrypt) ([Website](https://www.ledacrypt.org/))
* [ROLLO](encryption/rollo) ([Website](https://pqc-rollo.org/index.html))



### Signature

#### Lattice-based
* [Dilithium](signatures/dilithium) ([Website](https://pq-crystals.org/dilithium/))
* [qTESLA](signatures/qTESLA) ([Website](https://qtesla.org/))
* [FALCON](signatures/FALCON) ([Website](https://falcon-sign.info))

#### Multivariate
* [LUOV](signatures/LUOV) ([Website](https://www.esat.kuleuven.be/cosic/pqcrypto/luov/))
* [Rainbow](signatures/rainbow) ([Website](https://www.pqcrainbow.org/))
* [MQDSS](signatures/mqdss) ([Website](http://mqdss.org))

#### Hash-based
* [XMSS](signatures/xmss) ([Website](https://tools.ietf.org/html/rfc8391))
* [SPHINCS+](signatures/SPHINCS) ([Website](https://sphincs.org/))

#### Zero-knowledge proofs
* [Picnic](signatures/Picnic) ([Website](https://microsoft.github.io/Picnic/))

## Contribute

Please see [CONTRIBUTING](CONTRIBUTING.md).

Further documentation is also available for the various helper tools:
* [On schema validation](tools/validation/README.md)
* [On the enter-data-helper](tools/enter-data-helper/README.md)
* [On the frontend](frontend/README.md)

## Acknowledgments

This work was partly funded by the German Federal Ministry of Education and Research (BMBF) as part of the [FLOQI](https://floqi.org/) project (grant no. 16KIS1073) and the [KBLS](https://www.forschung-it-sicherheit-kommunikationssysteme.de/projekte/kbls) project (grant no. 16KIS1059K).
