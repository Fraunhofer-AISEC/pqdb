#!/usr/bin/env python3
# -*- coding: utf8 -*-

# Generates the XMSS / XMSS MT parameter set files from the parameter sets
# approved in NIST SP 800-208 (https://doi.org/10.6028/NIST.SP.800-208).
# Only the parameter sets defined by NIST SP 800-208 are included.

import yaml
from collections import namedtuple
from math import *

Param = namedtuple('Param', 'name hash hashlen n w len h d')
Param.mt = property(lambda self: self.d > 1)

_params = ( # source: NIST SP 800-208, RFC8391 for the SHA-256 sets
     ("XMSS-SHA2_10_256",       "sha2",      256, 32, 16,  67, 10,  1),
     ("XMSS-SHA2_16_256",       "sha2",      256, 32, 16,  67, 16,  1),
     ("XMSS-SHA2_20_256",       "sha2",      256, 32, 16,  67, 20,  1),
     ("XMSS-SHA2_10_192",       "sha2",      192, 24, 16,  51, 10,  1),
     ("XMSS-SHA2_16_192",       "sha2",      192, 24, 16,  51, 16,  1),
     ("XMSS-SHA2_20_192",       "sha2",      192, 24, 16,  51, 20,  1),
     ("XMSS-SHAKE256_10_256",   "shake256",  256, 32, 16,  67, 10,  1),
     ("XMSS-SHAKE256_16_256",   "shake256",  256, 32, 16,  67, 16,  1),
     ("XMSS-SHAKE256_20_256",   "shake256",  256, 32, 16,  67, 20,  1),
     ("XMSS-SHAKE256_10_192",   "shake256",  192, 24, 16,  51, 10,  1),
     ("XMSS-SHAKE256_16_192",   "shake256",  192, 24, 16,  51, 16,  1),
     ("XMSS-SHAKE256_20_192",   "shake256",  192, 24, 16,  51, 20,  1),
     ("XMSSMT-SHA2_20/2_256",   "sha2",      256, 32, 16,  67, 20,  2),
     ("XMSSMT-SHA2_20/4_256",   "sha2",      256, 32, 16,  67, 20,  4),
     ("XMSSMT-SHA2_40/2_256",   "sha2",      256, 32, 16,  67, 40,  2),
     ("XMSSMT-SHA2_40/4_256",   "sha2",      256, 32, 16,  67, 40,  4),
     ("XMSSMT-SHA2_40/8_256",   "sha2",      256, 32, 16,  67, 40,  8),
     ("XMSSMT-SHA2_60/3_256",   "sha2",      256, 32, 16,  67, 60,  3),
     ("XMSSMT-SHA2_60/6_256",   "sha2",      256, 32, 16,  67, 60,  6),
     ("XMSSMT-SHA2_60/12_256",  "sha2",      256, 32, 16,  67, 60, 12),
     ("XMSSMT-SHA2_20/2_192",   "sha2",      192, 24, 16,  51, 20,  2),
     ("XMSSMT-SHA2_20/4_192",   "sha2",      192, 24, 16,  51, 20,  4),
     ("XMSSMT-SHA2_40/2_192",   "sha2",      192, 24, 16,  51, 40,  2),
     ("XMSSMT-SHA2_40/4_192",   "sha2",      192, 24, 16,  51, 40,  4),
     ("XMSSMT-SHA2_40/8_192",   "sha2",      192, 24, 16,  51, 40,  8),
     ("XMSSMT-SHA2_60/3_192",   "sha2",      192, 24, 16,  51, 60,  3),
     ("XMSSMT-SHA2_60/6_192",   "sha2",      192, 24, 16,  51, 60,  6),
     ("XMSSMT-SHA2_60/12_192",  "sha2",      192, 24, 16,  51, 60, 12),
     ("XMSSMT-SHAKE256_20/2_256", "shake256",256, 32, 16,  67, 20,  2),
     ("XMSSMT-SHAKE256_20/4_256", "shake256",256, 32, 16,  67, 20,  4),
     ("XMSSMT-SHAKE256_40/2_256", "shake256",256, 32, 16,  67, 40,  2),
     ("XMSSMT-SHAKE256_40/4_256", "shake256",256, 32, 16,  67, 40,  4),
     ("XMSSMT-SHAKE256_40/8_256", "shake256",256, 32, 16,  67, 40,  8),
     ("XMSSMT-SHAKE256_60/3_256", "shake256",256, 32, 16,  67, 60,  3),
     ("XMSSMT-SHAKE256_60/6_256", "shake256",256, 32, 16,  67, 60,  6),
     ("XMSSMT-SHAKE256_60/12_256","shake256",256, 32, 16,  67, 60, 12),
     ("XMSSMT-SHAKE256_20/2_192", "shake256",192, 24, 16,  51, 20,  2),
     ("XMSSMT-SHAKE256_20/4_192", "shake256",192, 24, 16,  51, 20,  4),
     ("XMSSMT-SHAKE256_40/2_192", "shake256",192, 24, 16,  51, 40,  2),
     ("XMSSMT-SHAKE256_40/4_192", "shake256",192, 24, 16,  51, 40,  4),
     ("XMSSMT-SHAKE256_40/8_192", "shake256",192, 24, 16,  51, 40,  8),
     ("XMSSMT-SHAKE256_60/3_192", "shake256",192, 24, 16,  51, 60,  3),
     ("XMSSMT-SHAKE256_60/6_192", "shake256",192, 24, 16,  51, 60,  6),
     ("XMSSMT-SHAKE256_60/12_192","shake256",192, 24, 16,  51, 60, 12),
)
PARAMS = {x[0]: Param(*x) for x in _params}

# flavor folder suffix for the 192-bit hash variants
def flavor_dir(ps):
    suffix = '-192' if ps.n == 24 else ''
    return 'xmss-{}{}'.format(ps.hash, suffix)

def generate(ps):
    if isinstance(ps, str):
        ps = PARAMS[ps]

    _comment = ("Secret key size vastly depends on the implementation, and can be "
                "balanced against signing time. The given value is when using "
                "`treehash` from BDS08, estimated. "
                "Source: https://crypto.stackexchange.com/a/77292 . "
                "Absolute minimum is {min_sk} bytes.")

    # source: https://crypto.stackexchange.com/a/77292
    bds_sk = ceil((ps.n * (4 + (2*ps.d + 1)*(floor(3.5*ps.h/ps.d) - 4)) + 9*ps.h)/8)
    min_sk = 4 * ps.n + ceil(ps.h/8)

    return {
        'name': ps.name,
        'security level': {
            'classical': ps.n*8,
            'quantum': ps.n*8 // 2,
        },
        'number of operations': '2^{}'.format(ps.h),
        'failure probability': 0,
        'sizes': {
            'sk': bds_sk,
            'pk': 2*ps.n + 4, # source: RFC8391
            'ct|sig': 4 + ps.n + (ps.len + ps.h) * ps.n, # source: RFC8391
            'msg': ps.n * 8,
            'comment': _comment.format(min_sk=min_sk),
        },
    }

def make_filename(ps, prefix='signatures/xmss/'):
    if isinstance(ps, str):
        ps = PARAMS[ps]

    if ps.mt:
        t = '{prefix}{flav}/param/xmssmt-{hash}-{h}-{d}-{n8}.yaml'
    else:
        t = '{prefix}{flav}/param/xmss-{hash}-{h}-{n8}.yaml'

    return t.format(
        prefix=prefix,
        flav=flavor_dir(ps),
        hash=ps.hash,
        h=ps.h,
        n8=ps.n * 8,
        d=ps.d,
    )

if __name__ == '__main__':
    import sys
    if sys.argv[1:]:
        if sys.argv[1] == '--write':
            for p in PARAMS:
                with open(make_filename(p), 'w') as f:
                    yaml.dump(generate(p), f, sort_keys=False)
        else:
            yaml.dump(generate(sys.argv[1]), sys.stdout, sort_keys=False)
    else:
        for p in PARAMS:
            print(p)
