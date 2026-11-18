/*
 * Copyright (c) 2026, Fraunhofer AISEC.
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

import { Box, Container, Link, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

function Imprint() {
  useEffect(() => {
    document.title = 'Imprint - pqdb';
  }, []);

  return (
    <Container maxWidth="md">
      <Paper>
        <Box sx={{ p: { xs: 2.5, sm: 4 }, overflowWrap: 'anywhere' }}>

          <Typography component="h1" variant="h4" gutterBottom>Imprint</Typography>
          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Website Provider</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            The website <Link href="https://www.pqdb.info/">www.pqdb.info</Link> is provided by
            Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
          </Typography>
          <Typography component="address" sx={{ mb: 2, fontStyle: 'normal' }}>
            Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.<br />
            Hansastraße 27 c<br />
            80686 München, Germany<br />
            Internet: <Link href="https://www.fraunhofer.de/">www.fraunhofer.de</Link><br />
            E-Mail:
            {' '}
            <Box component="span" sx={{ color: 'primary.main', overflowWrap: 'anywhere' }}>
              info(at)zv.fraunhofer.de
            </Box>
          </Typography>

          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Institute and Contact</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            The website is operated by the Fraunhofer Institute for Applied and Integrated
            Security AISEC, a constituent entity of Fraunhofer-Gesellschaft with no separate
            legal status.
          </Typography>
          <Typography component="address" sx={{ mb: 2, fontStyle: 'normal' }}>
            Fraunhofer Institute for Applied and Integrated Security AISEC<br />
            Lichtenbergstraße 11<br />
            85748 Garching, Germany<br />
            Phone: +49 89 322 99 86-0
            <br />
            E-Mail:
            {' '}
            <Box component="span" sx={{ color: 'primary.main', overflowWrap: 'anywhere' }}>
              anfragen(at)aisec.fraunhofer.de
            </Box>
          </Typography>

          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Responsible Editor</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Prof. Dr. Georg Sigl
            <br />
            Managing Director
            <br />
            Fraunhofer Institute for Applied and Integrated Security AISEC
            <br />
            Lichtenbergstraße 11
            <br />
            85748 Garching near Munich
            <br />
            Phone: +49 89 3229986-159
            <br />
            E-Mail:
            {' '}
            <Box component="span" sx={{ color: 'primary.main', overflowWrap: 'anywhere' }}>
              georg.sigl(at)aisec.fraunhofer.de
            </Box>
          </Typography>

          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Registration and VAT Identification Number</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            VAT identification number in accordance with section 27 a of the German Value-Added
            Tax Act (Umsatzsteuergesetz, UStG): DE 129515865
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Registered nonprofit association.<br />
            Register court: Amtsgericht München (district court).<br />
            Registration number: VR 4461.
          </Typography>

          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Executive Board</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Holger Hanselka
            <br />
            President and Chairman of the Board | Corporate Strategy and Communications
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Constantin Häfner
            <br />
            Executive Board Member for Research and Transfer (executive unit VA)
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Axel Müller-Groeling
            <br />
            Executive Board Member for Research Infrastructures and Digital Transformation
            (executive unit VB)
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Elisabeth Ewen
            <br />
            Executive Board Member for Human Resources, Corporate Culture and Legal Affairs
            (executive unit VC)
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Sandra Krey
            <br />
            Executive Board Member for Finances and Controlling (executive unit VD)
          </Typography>

          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Usage Rights</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            © Fraunhofer-Gesellschaft e. V., Munich
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            The PQDB source code is licensed under the
            {' '}
            <Link href="https://www.apache.org/licenses/LICENSE-2.0">Apache License, Version 2.0</Link>.
            You may use, modify, and distribute it, including for commercial purposes, subject
            to the terms of that license. Third-party components remain subject to their
            respective licenses.
          </Typography>

          <Typography component="h2" variant="h5" sx={{ mt: 4, mb: 1.5 }}>Disclaimer</Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            We cannot assume any liability for the content of external pages. Solely the operators
            of those linked pages are responsible for their content.
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            We make every reasonable effort to ensure that the content of this website is kept up
            to date and that it is accurate and complete. Nevertheless, the possibility of errors
            cannot be entirely ruled out. We do not give any warranty in respect of the timeliness,
            accuracy or completeness of material published on this website and disclaim all
            liability for (material or non-material) loss or damage incurred by third parties
            arising from the use of content obtained from the website.
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            Registered trademarks and proprietary names, and copyrighted text and images, are not
            generally indicated as such on our webpages. But the absence of such indications in no
            way implies that these names, images or text belong to the public domain in the
            context of trademark or copyright law.
          </Typography>
          <Typography component="p" sx={{ mb: 2 }}>
            For more information on how we handle personal data, please see our
            {' '}
            <Link component={RouterLink} to="/privacy_policy">Privacy Policy</Link>.
          </Typography>

        </Box>
      </Paper>
    </Container>
  );
}

export default Imprint;
