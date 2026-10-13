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

import { Link } from '@mui/material';

const URL_REGEX = /(https?:\/\/[^\s()]+)/g;

export default function linkify(s) {
  return s.split(URL_REGEX).map((part, i) =>
    /^https?:\/\//.test(part)
      ? (
        <Link key={`${part}-${i}`} href={part} target="_blank" rel="noreferrer" sx={{ overflowWrap: 'anywhere' }}>
          {part}
        </Link>
      )
      : part,
  );
}
