# Database Scheme

There are five "tables" (speaking in sql terms), related as follows:

                        +-------------+
                        |   scheme    |
                        +-------------+
                               |
                        +-------------+
                        |   flavor    |
                        +-------------+
                       /               \
               +--------------+ +--------------+
               |implementation| |parameter set |
               +--------------+ +--------------+
                       \               /
                        +-------------+
                        |  benchmark  |
                        +-------------+

TODO: explain when to use flavor vs scheme vs parameter set (once it is final)

## scheme
* type (enc/sig) - deferred from the subdirectory
* name
* category (lattice etc)
* exact problems plus type of reduction (free text)
* date (YYYY[-MM[-DD]])
  * paper (first original scientific paper)
  * candidate (standardization proposal, such as NIST submission)
  * standardization (final standard -- rfc or similar)
* inventors
* trust in scheme (free text for now)
  * attacks
  * cryptanalysis
* nist round (0 if not a candidate, 1, 2)
* statefulness (boolean, although there might be nuances like "a few repetitions are secure")

## flavor
* -> scheme - deferred from the directory structure
* name ("FrodoKEM-SHAKE")
* type/api (better name?) (ktm, kem, ...)
* security notion achieved (IND-CCA, EUF-CMA, ...)
  * number of operations supported (one-time/few-time/...)
* dh-ness (symmetry, contributory-ness etc) (free text)

## parameter set
* -> flavor - deferred from the directory structure
* name
* security level achieved
  * classical (bits)
  * quantum (bits)
  * nist category (1..5)
* sizes (bytes)
  * public key
  * secret key (using nist api? (decaps is not given pub key))
    * optimized secret key (smallest key possible, even if expensive to use)
  * ciphertext
  * message (for KEMs, shared secret)
* failure probability (log2, or 0)

## implementation
* -> flavor - deferred from the directory structure
* description ("reference", "optimized using AES")
* platform (roughly)
* type of implementation (reference, optimized)
* security properties
  * side-channel attacks guarded against
    * timing
    * power consumption
    * ...??
* hardware features used
  * parallelity
  * aes hw instructions
  * vector instructions
* memory requirement
  * by operation (as below)
* code size
* randomness required
  * by operation (as below)

## benchmark
* -> implementation
* -> parameter set
* note: we could require specific filenames (e.g. `ref_512_processor.yaml`)
  that refer to implementation and parameter set, respectively, and defer these
* exact platform (used as name)
  * frequency
  * operating system
* time for (cycles or nanoseconds?)
  * key gen
  * enc(rypt|aps)
  * dec(rypt|aps)
  * sign
  * verify
* power consumption
* note: The fact that an implementation exists for a parameter set is expressed by the presence of at least one benchmark referring to them. Thus, empty benchmark entries (without timings) could exist, too.


# Open questions
* Tradeoffs possible between key size and time (e.g. Kyber). Store as different parameter set? Store secret key size within implementation, not parameter set?
* Allow some sort of "default" (storing attributes common to all implementations just once in the parent directory)



# Queries that should be possible
* reduction to one matrix: schemes along with
  - smallest¹ parameter set achieving
    - security notion a
    - security level b
  - fastest¹ timing
    - on hardware c using only features d and e

¹ for simplicity, calculated using average over all sizes



# List of criteria from meeting
* Define categories
  * key size (pk/sk)
  * cipher/signature size
  * performance
    * platforms
      * x64
      * ARM (M4, Cortex)
      * SmartCard
    * different implementations
      * ref
      * optimized
        * hardened ? 
        * side-channel categories
        * parallel
    * security level
* Define constraints
  * key sizes
  * performance
  * memory requirement
  * code size
  * state management
  * key re-use number
  * randomness requirement
    * how much
    * when ?
  * CPU features
  * power consumption
  * DH-likeness
    * symmetry
    * static keys
    * froward-secrecy
