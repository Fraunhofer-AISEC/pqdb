/*
 * Copyright (c) 2023-2026, Fraunhofer AISEC.
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

import ArticleIcon from '@mui/icons-material/Article';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import EncryptionIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';

import SealIcon from './icons/Seal';

const STAGES = {
  standardized: { short: 'Standardized', long: 'Standardized' },
  selected: { short: 'Standard Pending', long: 'Selected for Standardization' },
  4: { short: 'Round 4', long: 'Reached Round 4' },
  '3f': { short: 'Round 3 Finalist', long: 'Finalist in Round 3' },
  '3a': { short: 'Round 3 Alternate', long: 'Alternate Candidate in Round 3' },
  3: { short: 'Round 3', long: 'Reached Round 3' },
  2: { short: 'Round 2', long: 'Reached Round 2' },
  1: { short: 'Round 1', long: 'Reached Round 1' },
};

const PROCESSES = {
  'nist-pqc': 'NIST PQC Standardization Process',
  'nist-additional-sigs': 'NIST Additional Digital Signature Schemes',
  rfc: 'RFC (IETF)',
  'nist-sp': 'NIST Special Publication',
  iso: 'ISO',
  other: 'Other',
};

// Icon and one-line description for each standardization process, used on the
// Scheme Overview's process-selection tiles. `PROCESSES` above holds the name.
const PROCESS_META = {
  'nist-pqc': {
    icon: FactCheckIcon,
    description: 'Initial PQC standardization call from 2016',
  },
  'nist-additional-sigs': {
    icon: SealIcon,
    description: 'Additional signature schemes call from 2022',
  },
  rfc: {
    icon: ArticleIcon,
    description: 'Schemes standardized by the IETF via RFC',
  },
  'nist-sp': {
    icon: DescriptionIcon,
    description: 'Schemes published as NIST Special Publications',
  },
  iso: {
    icon: PublicIcon,
    description: 'Schemes standardized by the ISO',
  },
  other: {
    icon: CategoryIcon,
    description: 'Schemes in other standardization efforts',
  },
};

// Highest-to-lowest priority for deriving a scheme's single "headline" stage
// from its (possibly multiple) `status` rows, used for cards and badges.
const STAGE_PRIORITY = ['standardized', 'selected', '4', '3f', '3a', '3', '2', '1'];

// Pick the primary status row for a scheme: the one at the highest stage in
// STAGE_PRIORITY. Returns undefined when there is no status entry.
function derivePrimaryStatus(statusRows = []) {
  for (const stage of STAGE_PRIORITY) {
    const hit = statusRows.find((row) => String(row.stage) === stage);
    if (hit) return hit;
  }
  return undefined;
}

// Compose a full stage description for a status row, prefixing the name of the
// process it belongs to (used where the process is not already shown nearby).
function stageDescription(s) {
  const base = STAGES[s?.stage]?.long ?? s?.stage;
  if (!s?.process) return base;
  return `${PROCESSES[s.process] ?? s.process}: ${base}`;
}

// Compose a tooltip summarizing what a scheme's status entries say (process,
// stage, standard) so a multi-entry scheme (e.g. XMSS: RFC 8554 + SP 800-208)
// is fully described.
function statusTitle(statusRows = []) {
  const parts = statusRows.map((s) => stageDescription(s) + (s.standard ? ` (${s.standard})` : ''));
  return parts.join(' · ');
}

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

// Explicit left-to-right order in which status stages are displayed on the
// Scheme Overview page (Standardized first, then Selected, then highest round,
// then lower rounds).
const STATUS_DISPLAY_ORDER = ['standardized', 'selected', '4', '3f', '3a', '3', '2', '1'];

// Order in which top-level standardization processes are displayed on the
// Scheme Overview page. Each process renders its own round-banded section, so
// the two NIST tracks stay visually separate. Processes not listed here are
// appended after these in object-key order.
const PROCESS_DISPLAY_ORDER = ['nist-pqc', 'nist-additional-sigs'];

// Normalized platform families shared by implementations and benchmarks. The
// enum key is stored in `platform`; human-readable detail (exact CPU,
// frequency, compiler, OS) lives in the free-text `platform comment`.
const PLATFORMS = {
  desktop: { label: 'Desktop / x86-64', short: 'Desktop' },
  'arm-m4': { label: 'ARM Cortex-M4', short: 'Cortex-M4' },
  'arm-application': { label: 'ARM Application (Cortex-A/AArch64)', short: 'ARM App' },
  fpga: { label: 'FPGA', short: 'FPGA' },
  other: { label: 'Other', short: 'Other' },
};

// Default platform for comparisons ("each scheme has a desktop baseline").
const PLATFORM_DEFAULT = 'desktop';

const PLATFORM_ORDER = Object.keys(PLATFORMS);

export {
  derivePrimaryStatus,
  PLATFORM_DEFAULT,
  PLATFORM_ORDER,
  PLATFORMS,
  PROCESS_DISPLAY_ORDER,
  PROCESS_META,
  PROCESSES,
  SCHEME_TYPES,
  SEC_NOTIONS,
  stageDescription,
  STAGES,
  STATUS_DISPLAY_ORDER,
  statusTitle,
};
