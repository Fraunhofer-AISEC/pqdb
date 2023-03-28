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

import EncryptionIcon from '@mui/icons-material/LockOutlined';
import SealIcon from './icons/Seal';

const NIST_ROUNDS = {
  none: { short: null, long: 'Not submitted to the NIST standardization' },
  1: { short: 'round 1', long: 'Reached Round 1 of the NIST standardization' },
  2: { short: 'round 2', long: 'Reached Round 2 of the NIST standardization' },
  '3a': { short: 'round 3 alternate', long: 'Alternate Candidate in Round 3 of the NIST standardization' },
  '3f': { short: 'round 3 finalist', long: 'Finalist in Round 3 of the NIST standardization' },
  4: { short: 'round 4', long: 'Reached Round 4 of the NIST standardization' },
  S: { short: 'standardized', long: 'Standardized' },
};

const SEC_NOTIONS = {
  'IND-CCA': 'Indistinguishability under an adaptive Chosen Ciphertext Attack',
  'IND-CPA': 'Indistinguishability under an adaptive Chosen Plaintext Attack',
  'EUF-CMA': 'Existential Unforgeability under a Chosen Message Attack',
  'SUF-CMA': 'Strong Existential Unforgeability under a Chosen Message Attack',
};

const SCHEME_TYPES = {
  enc: {
    name: 'Key Exchange Scheme',
    icon: EncryptionIcon,
    ctsig: 'ct',
    ct_sig: 'Ciphertext',
    encsign: 'enc',
    enc_sign: 'Encrypt',
    decvrfy: 'dec',
    dec_vrfy: 'Decrypt',
  },
  sig: {
    name: 'Signature Scheme',
    icon: SealIcon,
    ctsig: 'sig',
    ct_sig: 'Signature',
    encsign: 'sign',
    enc_sign: 'Sign',
    decvrfy: 'vrfy',
    dec_vrfy: 'Verify',
  },
};

export { NIST_ROUNDS, SCHEME_TYPES, SEC_NOTIONS };
