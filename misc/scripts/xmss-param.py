#!/usr/bin/env python3
# -*- coding: utf8 -*-

import yaml
from collections import namedtuple
from math import *

Param = namedtuple('Param', 'name hash hashlen n w len h d')
Param.mt = property(lambda self: self.d > 1)

_params = ( # source: RFC8391
     ("XMSS-SHA2_10_256",       "SHA2",  256, 32, 16,  67, 10,  1),
     ("XMSS-SHA2_16_256",       "SHA2",  256, 32, 16,  67, 16,  1),
     ("XMSS-SHA2_20_256",       "SHA2",  256, 32, 16,  67, 20,  1),
     ("XMSS-SHA2_10_512",       "SHA2",  512, 64, 16, 131, 10,  1),
     ("XMSS-SHA2_16_512",       "SHA2",  512, 64, 16, 131, 16,  1),
     ("XMSS-SHA2_20_512",       "SHA2",  512, 64, 16, 131, 20,  1),
     ("XMSS-SHAKE_10_256",      "SHAKE", 128, 32, 16,  67, 10,  1),
     ("XMSS-SHAKE_16_256",      "SHAKE", 128, 32, 16,  67, 16,  1),
     ("XMSS-SHAKE_20_256",      "SHAKE", 128, 32, 16,  67, 20,  1),
     ("XMSS-SHAKE_10_512",      "SHAKE", 256, 64, 16, 131, 10,  1),
     ("XMSS-SHAKE_16_512",      "SHAKE", 256, 64, 16, 131, 16,  1),
     ("XMSS-SHAKE_20_512",      "SHAKE", 256, 64, 16, 131, 20,  1),
     ("XMSSMT-SHA2_20/2_256",   "SHA2",  256, 32, 16,  67, 20,  2),
     ("XMSSMT-SHA2_20/4_256",   "SHA2",  256, 32, 16,  67, 20,  4),
     ("XMSSMT-SHA2_40/2_256",   "SHA2",  256, 32, 16,  67, 40,  2),
     ("XMSSMT-SHA2_40/4_256",   "SHA2",  256, 32, 16,  67, 40,  4),
     ("XMSSMT-SHA2_40/8_256",   "SHA2",  256, 32, 16,  67, 40,  8),
     ("XMSSMT-SHA2_60/3_256",   "SHA2",  256, 32, 16,  67, 60,  3),
     ("XMSSMT-SHA2_60/6_256",   "SHA2",  256, 32, 16,  67, 60,  6),
     ("XMSSMT-SHA2_60/12_256",  "SHA2",  256, 32, 16,  67, 60, 12),
     ("XMSSMT-SHA2_20/2_512",   "SHA2",  512, 64, 16, 131, 20,  2),
     ("XMSSMT-SHA2_20/4_512",   "SHA2",  512, 64, 16, 131, 20,  4),
     ("XMSSMT-SHA2_40/2_512",   "SHA2",  512, 64, 16, 131, 40,  2),
     ("XMSSMT-SHA2_40/4_512",   "SHA2",  512, 64, 16, 131, 40,  4),
     ("XMSSMT-SHA2_40/8_512",   "SHA2",  512, 64, 16, 131, 40,  8),
     ("XMSSMT-SHA2_60/3_512",   "SHA2",  512, 64, 16, 131, 60,  3),
     ("XMSSMT-SHA2_60/6_512",   "SHA2",  512, 64, 16, 131, 60,  6),
     ("XMSSMT-SHA2_60/12_512",  "SHA2",  512, 64, 16, 131, 60, 12),
     ("XMSSMT-SHAKE_20/2_256",  "SHAKE", 128, 32, 16,  67, 20,  2),
     ("XMSSMT-SHAKE_20/4_256",  "SHAKE", 128, 32, 16,  67, 20,  4),
     ("XMSSMT-SHAKE_40/2_256",  "SHAKE", 128, 32, 16,  67, 40,  2),
     ("XMSSMT-SHAKE_40/4_256",  "SHAKE", 128, 32, 16,  67, 40,  4),
     ("XMSSMT-SHAKE_40/8_256",  "SHAKE", 128, 32, 16,  67, 40,  8),
     ("XMSSMT-SHAKE_60/3_256",  "SHAKE", 128, 32, 16,  67, 60,  3),
     ("XMSSMT-SHAKE_60/6_256",  "SHAKE", 128, 32, 16,  67, 60,  6),
     ("XMSSMT-SHAKE_60/12_256", "SHAKE", 128, 32, 16,  67, 60, 12),
     ("XMSSMT-SHAKE_20/2_512",  "SHAKE", 256, 64, 16, 131, 20,  2),
     ("XMSSMT-SHAKE_20/4_512",  "SHAKE", 256, 64, 16, 131, 20,  4),
     ("XMSSMT-SHAKE_40/2_512",  "SHAKE", 256, 64, 16, 131, 40,  2),
     ("XMSSMT-SHAKE_40/4_512",  "SHAKE", 256, 64, 16, 131, 40,  4),
     ("XMSSMT-SHAKE_40/8_512",  "SHAKE", 256, 64, 16, 131, 40,  8),
     ("XMSSMT-SHAKE_60/3_512",  "SHAKE", 256, 64, 16, 131, 60,  3),
     ("XMSSMT-SHAKE_60/6_512",  "SHAKE", 256, 64, 16, 131, 60,  6),
     ("XMSSMT-SHAKE_60/12_512", "SHAKE", 256, 64, 16, 131, 60, 12),
)
PARAMS = {x[0]: Param(*x) for x in _params}

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
        t = '{prefix}xmss-{hash}/param/xmssmt-{hash}-{h}-{d}-{n8}.yaml'
    else:
        t = '{prefix}xmss-{hash}/param/xmss-{hash}-{h}-{n8}.yaml'

    return t.format(
        prefix=prefix,
        hash=ps.hash.lower(),
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
