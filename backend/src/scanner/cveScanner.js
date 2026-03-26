const axios = require('axios');

const OSV_API_URL = 'https://api.osv.dev/v1/query';
const RATE_LIMIT_DELAY = 100; // milliseconds between requests

/**
 * Sleep for specified milliseconds (for rate limiting)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract CVE ID from aliases array
 * Aliases may contain: CVE-2021-1234, GHSA-xxxx-yyyy-zzzz, etc.
 * @param {Array} aliases - Array of vulnerability aliases
 * @returns {string} CVE ID or first alias or 'N/A'
 */
const extractCveId = (aliases) => {
  if (!Array.isArray(aliases) || aliases.length === 0) {
    return 'N/A';
  }

  // Look for CVE ID first
  const cveId = aliases.find(alias => alias.startsWith('CVE-'));
  if (cveId) {
    return cveId;
  }

  // Use first alias if no CVE ID found
  return aliases[0] || 'N/A';
};

/**
 * Determine severity from OSV vulnerability data
 * OSV uses numeric severity scores, convert to HIGH/CRITICAL
 * @param {object} vuln - Vulnerability object from OSV
 * @returns {string} Severity level: CRITICAL, HIGH, MEDIUM, LOW
 */
const determineSeverity = (vuln) => {
  // Check database_specific for severity
  if (vuln.database_specific) {
    if (vuln.database_specific.severity) {
      const severity = vuln.database_specific.severity.toUpperCase();
      if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
        return severity;
      }
    }

    // Check for CVSS score if available
    if (vuln.database_specific.cvss_v3_score) {
      const score = parseFloat(vuln.database_specific.cvss_v3_score);
      if (score >= 9.0) return 'CRITICAL';
      if (score >= 7.0) return 'HIGH';
      if (score >= 4.0) return 'MEDIUM';
      return 'LOW';
    }
  }

  // Check for severity in main object
  if (vuln.severity) {
    const severity = vuln.severity ? String(vuln.severity).toUpperCase() : 'UNKNOWN';
    if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
      return severity;
    }
  }

  return 'MEDIUM'; // Default
};

/**
 * Extract fixed version from vulnerability data
 * @param {object} vuln - Vulnerability object
 * @param {string} packageName - Package name
 * @returns {string} Fixed version or empty string
 */
const extractFixedVersion = (vuln, packageName) => {
  try {
    if (!vuln.affected || !Array.isArray(vuln.affected)) {
      return '';
    }

    // Find affected entry for this package
    const affectedEntry = vuln.affected.find(
      a => a.package && 
           a.package.name && 
           a.package.name.toLowerCase() === packageName.toLowerCase()
    );

    if (!affectedEntry || !Array.isArray(affectedEntry.ranges)) {
      return '';
    }

    // Look for RANGES_TYPE_FIXED ranges
    for (const range of affectedEntry.ranges) {
      if (range.type === 'SEMVER' && Array.isArray(range.events)) {
        // Find the fixed event
        const fixedEvent = range.events.find(e => e.fixed);
        if (fixedEvent && fixedEvent.fixed) {
          return fixedEvent.fixed;
        }
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting fixed version:', error.message);
    return '';
  }
};

/**
 * Check if a package version is affected by vulnerability
 * @param {string} packageVersion - Package version to check
 * @param {object} vuln - Vulnerability object
 * @param {string} packageName - Package name
 * @returns {boolean} True if version is affected
 */
const isVersionAffected = (packageVersion, vuln, packageName) => {
  try {
    if (!vuln.affected || !Array.isArray(vuln.affected)) {
      return true; // Assume affected if can't determine
    }

    const affectedEntry = vuln.affected.find(
      a => a.package && 
           a.package.name && 
           a.package.name.toLowerCase() === packageName.toLowerCase()
    );

    if (!affectedEntry) {
      return false; // Package not in affected list
    }

    // For simplicity, mark as affected if version is in affected entry
    // In production, would need full semantic version comparison
    return true;
  } catch (error) {
    return true; // Assume affected on error
  }
};

/**
 * Check vulnerabilities for multiple packages using OSV API
 * @param {Array} packages - Array of { name, version } objects
 * @returns {Promise<Array>} Array of vulnerable packages with CVE details
 */
const checkVulnerabilities = async (packages) => {
  const vulnerablePackages = [];
  const validPackages = packages.filter(p => p && p.name && p.version);

  if (validPackages.length === 0) {
    console.warn('[CVEScanner] No valid packages to check');
    return vulnerablePackages;
  }

  console.log(`[CVEScanner] Checking ${validPackages.length} packages for vulnerabilities`);

  for (let i = 0; i < validPackages.length; i++) {
    const pkg = validPackages[i];

    try {
      // Add rate limiting delay (except for first request)
      if (i > 0) {
        await sleep(RATE_LIMIT_DELAY);
      }

      console.log(`[CVEScanner] Checking ${pkg.name}@${pkg.version}`);

      // Call OSV API
      const response = await axios.post(
        OSV_API_URL,
        {
          package: {
            name: pkg.name
          },
          version: pkg.version
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const osvData = response.data;

      // If vulnerabilities found, process them
      if (osvData.vulns && Array.isArray(osvData.vulns) && osvData.vulns.length > 0) {
        console.log(`[CVEScanner] Found ${osvData.vulns.length} vulnerabilities for ${pkg.name}@${pkg.version}`);

        const vulns = osvData.vulns.map(vuln => ({
          cveId: extractCveId(vuln.aliases || []),
          aliases: vuln.aliases || [],
          severity: determineSeverity(vuln),
          summary: vuln.summary || vuln.details || 'No description available',
          published: vuln.published || '',
          modified: vuln.modified || '',
          affectedVersions: vuln.affected || [],
          fixedVersion: extractFixedVersion(vuln, pkg.name),
          links: vuln.references || [],
          databaseSpecific: vuln.database_specific || {},
          osvId: vuln.id || ''
        }));

        vulnerablePackages.push({
          name: pkg.name,
          version: pkg.version,
          vulnerabilityCount: vulns.length,
          vulnerabilities: vulns,
          checkedAt: new Date().toISOString()
        });
      } else {
        console.log(`[CVEScanner] No vulnerabilities found for ${pkg.name}@${pkg.version}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Rate limited
        console.warn(`[CVEScanner] Rate limited by OSV API, waiting 5 seconds...`);
        await sleep(5000);
        
        // Retry
        try {
          const retryResponse = await axios.post(
            OSV_API_URL,
            {
              package: { name: pkg.name },
              version: pkg.version
            },
            { timeout: 10000 }
          );

          if (retryResponse.data.vulns && retryResponse.data.vulns.length > 0) {
            const vulns = retryResponse.data.vulns.map(vuln => ({
              cveId: extractCveId(vuln.aliases || []),
              aliases: vuln.aliases || [],
              severity: determineSeverity(vuln),
              summary: vuln.summary || vuln.details || 'No description available',
              published: vuln.published || '',
              modified: vuln.modified || '',
              affectedVersions: vuln.affected || [],
              fixedVersion: extractFixedVersion(vuln, pkg.name),
              links: vuln.references || [],
              databaseSpecific: vuln.database_specific || {},
              osvId: vuln.id || ''
            }));

            vulnerablePackages.push({
              name: pkg.name,
              version: pkg.version,
              vulnerabilityCount: vulns.length,
              vulnerabilities: vulns,
              checkedAt: new Date().toISOString()
            });
          }
        } catch (retryError) {
          console.error(`[CVEScanner] Retry failed for ${pkg.name}@${pkg.version}:`, retryError.message);
        }
      } else if (error.response && error.response.status === 404) {
        // Package not found on OSV
        console.log(`[CVEScanner] Package not found on OSV: ${pkg.name}`);
      } else {
        console.error(`[CVEScanner] Error checking ${pkg.name}@${pkg.version}:`, error.message);
      }
    }
  }

  console.log(`[CVEScanner] Scan complete. Found ${vulnerablePackages.length} packages with vulnerabilities`);
  return vulnerablePackages;
};

/**
 * Get summary statistics from vulnerability check
 * @param {Array} results - Results from checkVulnerabilities
 * @returns {object} Summary object
 */
const getVulnerabilitySummary = (results) => {
  const summary = {
    totalPackagesChecked: results.length,
    packagesWithVulnerabilities: results.length,
    totalVulnerabilities: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    packagesBySeverity: {}
  };

  for (const pkg of results) {
    for (const vuln of pkg.vulnerabilities) {
      summary.totalVulnerabilities++;
      
      if (vuln.severity === 'CRITICAL') {
        summary.criticalCount++;
      } else if (vuln.severity === 'HIGH') {
        summary.highCount++;
      } else if (vuln.severity === 'MEDIUM') {
        summary.mediumCount++;
      } else if (vuln.severity === 'LOW') {
        summary.lowCount++;
      }
    }

    // Track by package
    if (!summary.packagesBySeverity[pkg.name]) {
      summary.packagesBySeverity[pkg.name] = {
        version: pkg.version,
        severities: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
      };
    }

    for (const vuln of pkg.vulnerabilities) {
      summary.packagesBySeverity[pkg.name].severities[vuln.severity]++;
    }
  }

  return summary;
};

module.exports = {
  checkVulnerabilities,
  getVulnerabilitySummary,
  extractCveId,
  determineSeverity,
  extractFixedVersion,
  isVersionAffected
};
