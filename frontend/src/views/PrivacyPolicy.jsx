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

import {
  Box,
  Container,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect } from 'react';

function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - pqdb';
  }, []);

  return (
    <Container maxWidth="md">
      <Paper>
        <Box p={4}>
          <Typography variant="h4" gutterBottom>Privacy Policy</Typography>
          <Typography paragraph>
            The information on this website is for informational purposes only. We do not process
            personal data beyond what is technically necessary for the provision of this service.
            Personal data, as defined by Article 4 (1) General Data Protection Regulation (GDPR),
            include all information related to an identified or identifiable natural person.
          </Typography>
          <Typography variant="h5" gutterBottom>1. Name and Contact Information of Controller and Corporate Data Protection Officer</Typography>
          <Typography paragraph>
            This data protection information applies to data processing on our website
            {' '}
            <Link href="https://www.pqdb.info/">www.pqdb.info</Link>
            {' '}
            by the controller:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
            <br />
            Hansastraße 27 c
            <br />
            80686 München, Germany
            <br />
            Internet:
            {' '}
            <Link href="https://www.fraunhofer.de/">www.fraunhofer.de</Link>
            <br />
            E-Mail:
            {' '}
            <Box component="span" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
              info(at)zv.fraunhofer.de
            </Box>
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            (hereinafter referred to as “Fraunhofer”)
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            on behalf of its
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            Fraunhofer-Institut für Angewandte und Integrierte Sicherheit AISEC
            <br />
            Lichtenbergstraße 11
            <br />
            85748 Garching, Germany
            <br />
            Telephone: +49 89 322 99 86-0
          </Typography>
          <Typography paragraph>
            The corporate data protection officer at Fraunhofer can be reached at the
            above-mentioned address, c/o Data Protection Officer or at
            {' '}
            <Box component="span" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
              datenschutz(at)zv.fraunhofer.de
            </Box>
            . Please feel free to contact the data protection officer directly at any time if
            you have questions concerning data protection law and/or your rights as data subject.
          </Typography>
          <Typography variant="h5" gutterBottom>2. Personal Data Processing and Purposes of Data Processing</Typography>
          <Typography variant="h6" gutterBottom>a) When visiting the website</Typography>
          <Typography paragraph>
            We do not process any personal data on this website ourselves. This website is hosted
            as a GitHub Pages website. GitHub may collect personal information from visitors to
            this website. See the
            {' '}
            <Link href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub Privacy Statement</Link>
            {' '}
            for more details.
          </Typography>
          <Typography variant="h6" gutterBottom>b) Further data collection</Typography>
          <Typography paragraph>
            No additional data is collected on this website (e.g., through cookies, analytics
            tools, or contact forms).
          </Typography>
          <Typography variant="h5" gutterBottom>3. Transfer of Data</Typography>
          <Typography paragraph>
            If we transfer personal data collected through websites to processors, we will notify
            you in this data protection information regarding the respective data processing
            operation, citing the specific recipient.
          </Typography>
          <Typography paragraph>
            Aside from that, we will transfer your personal data only if
            <ul>
              <li>you have given explicit consent pursuant to Art. 6 (1) lit. a GDPR;</li>
              <li>
                this is necessary pursuant to Article 6 (1) lit. b GDPR for the performance of a
                contract with you (for example, transfer to shipping companies for the purpose of
                delivering goods ordered by you, or transmitting payment information to payment
                service providers or credit institutions in order to process a payment transaction);
              </li>
              <li>there is a legal obligation for transfer pursuant to Art. 6 (1) lit. c GDPR.</li>
            </ul>
            The recipients must not use the transferred data for any purposes other than the
            above-mentioned ones.
          </Typography>
          <Typography variant="h5" gutterBottom>4. Rights of the Data Subject</Typography>
          <Typography paragraph>
            You have the right:
            <ul>
              <li>
                pursuant to Art. 7(3) GDPR, to withdraw your consent at any time. This means that
                we may not continue the data processing based on this consent in the future;
              </li>
              <li>
                pursuant to Art. 15 GDPR, to obtain access to your personal data processed by us.
                In particular, you may request information about the purposes of the processing,
                the categories of personal data concerned, the categories of recipients to whom the
                personal data have been or will be disclosed, and the envisaged period for which the
                data will be stored. Moreover, you have the right to request rectification, erasure,
                or restriction of processing, to object to processing, the right to lodge a
                complaint, and to obtain information about the source of your data if they were not
                collected by us as well as about the existence of automated decision-making,
                including profiling, and, if applicable, meaningful information about the details
                involved;
              </li>
              <li>
                pursuant to Art. 16 GDPR, to obtain without undue delay the rectification of
                inaccurate data or the completion of your personal data stored by us;
              </li>
              <li>
                pursuant to Art. 17 GDPR, to obtain the erasure of personal data stored by us unless
                processing is necessary to exercise the right of freedom of expression and
                information, to comply with a legal obligation, for reasons of public interest, or
                to establish, exercise or defend legal claims;
              </li>
              <li>
                pursuant to Art. 18 GDPR, to obtain restriction of processing of your personal data
                if you contest the accuracy of the data, the processing is unlawful but you oppose
                the erasure of the personal data, or if we no longer need the personal data while
                you still require it for establishing, exercising or defending legal claims, or if
                you have filed an objection to the processing pursuant to Art. 21 GDPR;
              </li>
              <li>
                pursuant to Art. 20 GDPR, to receive your personal data that you have provided to
                us, in a structured, commonly used and machine-readable format or to demand the
                transfer of those data to another controller and
              </li>
              <li>
                pursuant to Art. 77 GDPR, the right to lodge a complaint with a supervisory
                authority. Generally, you may contact the supervisory authority of your usual
                residence, place of work or the registered offices of our organization.
              </li>
            </ul>
          </Typography>
          <Typography variant="h5" gutterBottom>5. Information on your right to object pursuant to Art. 21 GDPR</Typography>
          <Typography paragraph>
            You have the right to object, on grounds relating to your particular situation, at any
            time to processing of your personal data pursuant to Art. 6 (1) lit. e GDPR (data
            processing carried out in the public interest) and Art. 6 (1) lit. f GDPR (data
            processing for purposes of legitimate interests). This also applies to any profiling as
            defined in Art. 4 (4) GDPR that is based on said provision in Art. 6.
          </Typography>
          <Typography paragraph>
            If you file an objection, we will no longer process your personal data unless we can
            demonstrate compelling legitimate grounds for processing that override your interests,
            rights and freedoms, or unless the processing serves the establishment, exercise or
            defense of legal claims.
          </Typography>
          <Typography paragraph>
            If your objection is directed against the processing of data for the purpose of direct
            advertising, we will stop the processing immediately. In this case, citing a special
            situation is not necessary. This includes profiling to the extent that it is related to
            such direct advertising.
          </Typography>
          <Typography paragraph>
            If you would like to assert your right to object, simply send an email to
            {' '}
            <Box component="span" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
              datenschutzkoordination(at)zv.fraunhofer.de
            </Box>
            .
          </Typography>
          <Typography variant="h5" gutterBottom>6. Data Security</Typography>
          <Typography paragraph>
            All your personal data are transmitted in encrypted format, using the widely used and
            secure TLS (Transport Layer Security) standard. TLS is a secure and proven standard that
            is also used, for instance, in online banking. You will recognize a secure TLS
            connection by the additional s after http (i.e., https://...) in the address bar of your
            browser or by the lock icon in the bottom part of your browser window.
          </Typography>
          <Typography paragraph>
            In all other regards, we use suitable technical and organizational security measures to
            protect your data against accidental or intentional manipulations, partial or complete
            loss, destruction, or the unauthorized access of third parties. We continuously improve
            our security measures in accordance with the state of the art.
          </Typography>
          <Typography variant="h5" gutterBottom>7. Timeliness and Amendments to this Data Protection Information</Typography>
          <Typography paragraph>
            The further development of our website and the products and services offered or changed
            due to statutory or regulatory requirements, respectively, may make it necessary to
            amend this data protection information. You may access and print out the latest data
            protection information at any time from our website.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyPolicy;
