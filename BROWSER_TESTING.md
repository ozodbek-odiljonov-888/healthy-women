# Healthy Women browser E2E checks

This GitHub Actions workflow uses a real headless Chromium browser and a loopback static server. It tests fictional daily diary input, encrypted backup, local encryption migration, wrong-password rejection, unlock and reload lock, backup restoration, and mobile navigation.

No real patient data, BotFather credentials, cloud synchronization or paid deployment is involved. The test browser profile and temporary backups are discarded after execution.

Browser smoke tests supplement unit tests; they cannot replace Android hardware testing or independent security and clinical reviews. GitHub Actions usage remains subject to the repository's normal limits.
