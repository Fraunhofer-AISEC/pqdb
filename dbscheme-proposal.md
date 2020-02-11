# Database Scheme

## scheme
* type (enc/sig)
* name
* category (lattice etc)
* exact problems plus type of reduction (free text)
* year
  * paper (first original scientific paper)
  * candidate (standardization proposal
  * standardization (final standard, rfc or similar)
* inventors
* trust in scheme (free text for now)
  * attacks
  * cryptanalysis
* statefulness (boolean, although there might be nuances like "a few repetitions are secure")

## parameter set (better name?)
* -> scheme
* name ("Lightsaber", "Papa Bear")
* type/api (better name?) (ktm, kem, ...)
* security level achieved
  * classical (bits)
  * quantum (bits)
  * nist category (1..5)
* security notion achieved (IND-CCA, EUF-CMA, ...)
  * number of operations supported (one-time/few-time/...)
* sizes (bytes)
  * public key
  * secret key (using nist api? (decaps is not given pub key))
    * optimized secret key (smallest key possible, even if expensive to use)
  * ciphertext
  * message (for KEMs, shared secret)
* failure probability (log2, or 0)
* dh-ness (symmetry, contributory-ness etc) (free text)

## implementation
* -> parameter set
* description ("reference", "optimized using AES")
* platform (roughly)
* type of implementation (reference, optimized)
* security properties
  * side-channel attacks guarded against
    * timing
    * power consumption
    * ...??
* hardware features used (with respect to timings) (move some of this to timing?)
  * parallelity
  * aes hw instructions
  * vector instructions
* memory requirement
  * by operation (as below)
* code size (move this to timing?)
* randomness required
  * by operation (as below)

## timing
* -> implementation
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
