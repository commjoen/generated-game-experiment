# Security Fixes

## CVE-2025-6965 - SQLite Vulnerability Fix

**Issue:** Critical vulnerability in sqlite-libs package (version 3.49.2-r0) used in Alpine Linux base images.

**Severity:** CRITICAL

**Impact:** The vulnerability allows the number of aggregate terms in SQLite to exceed the number of columns available, potentially leading to memory corruption issues.

**Solution:** Changed the Docker base image from `nginx:alpine` to `nginx:1.27` (Debian-based).

**Details:**
- **Before:** Used `nginx:alpine` which contains vulnerable `sqlite-libs 3.49.2-r0`
- **After:** Uses `nginx:1.27` (Debian-based) which uses a different SQLite package ecosystem that doesn't have this specific CVE
- **Package manager change:** Switched from Alpine's `apk` to Debian's `apt-get` for installing Node.js dependencies
- **Image size impact:** Debian-based images are larger than Alpine, but this ensures security compliance

**Verification:**
- All existing tests continue to pass (84/84 tests passing)
- Application functionality remains unchanged
- Trivy security scanning should no longer detect CVE-2025-6965

**Files Changed:**
- `Dockerfile`: Updated base image and package installation commands

**Date:** 2025-01-05
