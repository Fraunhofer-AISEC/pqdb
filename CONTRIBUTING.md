The goal of this project is to provide a detailed overview of all post-quantum schemes currently [under consideration for standardization](https://en.wikipedia.org/wiki/Post-Quantum_Cryptography_Standardization) and to provide extensive querying options.
The main aim is to aid users in choosing the most appropriate scheme for their use case.

To make this possible for specialized use cases (for example, constrained devices) we try to gather as much data as possible.
This includes benchmarks, memory requirements, parameter sizes, and energy requirements.

Contributing
============

Technicalities
--------------

We prefer to get contributions in form of a pull request. So please, first check out the repository and create your own branch (name it after the scheme you're about to add).

Data is stored in `.yaml` files inside the directories `signatures/` or `encryption/`, respectively. (In this context, we use the term *encryption* for every kind of key agreement.)
You can either edit the yaml files directly (use the JSON Schema files in `schema/` as a reference, or look at existing schemes), or use the `enter-data-helper` tool ([instructions here](/tools/enter-data-helper/README.md)). For new users, we recommend the latter. (You can mix usage of both; for example, to create two similar structures, you may create the first structure using the helper and then copy all the files and edit the copy again using the helper.)

There is a script that checks validity of the data structure.
The enter-data-helper normally only allows entering valid data, so you probably won't need it unless you edited files manually.
We have configured github hooks that automatically run validation after pushing. You can also [run validation locally](tools/validation/README.md).

If you think a change to the schema is necessary (for example to add further APIs or security notions), please do so in a separate commit and justify the change.

When you are done, please [create a pull request](https://github.com/cryptoeng/pqdb/compare).

Data Format Overview
--------------------

Data is stored in a hierarchical structure as follows.
```
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
```
We count everything described in one NIST submission as one scheme.
Under scheme, we store basic information such as authors and problems the scheme's security is based on.

We sometimes use more than one flavor per scheme if a scheme has several "groups" of parameter sets that differ strongly from another (by having vastly different implementations, different approaches, etc).
Don't take this too important. For most schemes, there's only one flavor. If you're uncertain, ask us beforehand.

Usually, there are several parameter sets. A parameter set is defined by API compatibility (aka one set of KAT files). Note that we only consider the public API here: different compression levels of the secret key can still be the same parameter set.
Here, we store data such as key size and security levels.

An implementation can support various parameter sets or just one (if this is chosen at compile time, it results in several implementations, because code size etc differs).
We store static properties of the code, such as its size and which hardware features it requires, and whether it's constant-time.

A benchmark stores data about the execution of one implementation on one machine using one specific parameter set.
Here, we mainly store timings, but also data such as memory and energy usage, if available.

Notes
-----

Check the info icons in the enter-data-helper for information about what to enter (or, if you edit the files by hand, have a look at the schema files).

You don't have to enter everything. Sometimes only a subset of the parameter sets or of the implementations are interesting.
Some data can also easily be imported from other places (for example, we import benchmarks from the [pqm4 project](https://github.com/mupq/pqm4) automatically).
