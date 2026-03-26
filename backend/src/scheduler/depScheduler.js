const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { fetchFileContent } = require('../services/githubService');
const { parsePackageJson, parseRequirementsTxt } = require('../scanner/dependencyParser');
const { checkVulnerabilities } = require('../scanner/cveScanner');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * Scan dependencies for a single repository
 * @param {object} repo - Repository object from database
 * @returns {Promise<object>} Scan results { scanned, newVulns, skipped, errors }
 */
const scanRepositoryDependencies = async (repo) => {
  const results = {
    repoName: repo.name,
    scanned: false,
    packagesFound: 0,
    vulnerabilitiesChecked: 0,
    newVulns: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log(`[DepScheduler] Scanning ${repo.owner}/${repo.name}`);

    // Fetch package files
    let dependencies = [];

    // Try to fetch package.json (Node.js)
    try {
      console.log(`[DepScheduler] Fetching package.json from ${repo.owner}/${repo.name}`);
      const packageJsonContent = await fetchFileContent(
        repo.owner,
        repo.name,
        'package.json',
        process.env.GITHUB_TOKEN,
        repo.defaultBranch
      );

      const nodeDeps = parsePackageJson(packageJsonContent);
      dependencies = dependencies.concat(nodeDeps);
      console.log(`[DepScheduler] Found ${nodeDeps.length} Node.js dependencies`);
    } catch (error) {
      if (error.status === 404) {
        console.log(`[DepScheduler] package.json not found in ${repo.owner}/${repo.name}`);
      } else {
        console.error(`[DepScheduler] Error fetching package.json:`, error.message);
        results.errors.push(`Failed to fetch package.json: ${error.message}`);
      }
    }

    // Try to fetch requirements.txt (Python)
    try {
      console.log(`[DepScheduler] Fetching requirements.txt from ${repo.owner}/${repo.name}`);
      const requirementsContent = await fetchFileContent(
        repo.owner,
        repo.name,
        'requirements.txt',
        process.env.GITHUB_TOKEN,
        repo.defaultBranch
      );

      const pythonDeps = parseRequirementsTxt(requirementsContent);
      dependencies = dependencies.concat(pythonDeps);
      console.log(`[DepScheduler] Found ${pythonDeps.length} Python dependencies`);
    } catch (error) {
      if (error.status === 404) {
        console.log(`[DepScheduler] requirements.txt not found in ${repo.owner}/${repo.name}`);
      } else {
        console.error(`[DepScheduler] Error fetching requirements.txt:`, error.message);
        results.errors.push(`Failed to fetch requirements.txt: ${error.message}`);
      }
    }

    // If no dependencies found, mark as scanned but nothing to do
    if (dependencies.length === 0) {
      console.log(`[DepScheduler] No dependencies found for ${repo.owner}/${repo.name}`);
      results.scanned = true;
      return results;
    }

    results.packagesFound = dependencies.length;
    console.log(`[DepScheduler] Total dependencies to check: ${dependencies.length}`);

    // Check vulnerabilities for all dependencies
    const vulnerabilityResults = await checkVulnerabilities(dependencies);
    results.vulnerabilitiesChecked = vulnerabilityResults.length;

    console.log(`[DepScheduler] Vulnerability check complete: ${vulnerabilityResults.length} packages with vulns`);

    // Save vulnerabilities to database
    for (const vulnPackage of vulnerabilityResults) {
      for (const vuln of vulnPackage.vulnerabilities) {
        try {
          // Check if this vulnerability already exists (duplicate prevention)
          const existingVuln = await prisma.vuln.findFirst({
            where: {
              repoId: repo.id,
              cveId: vuln.cveId,
              packageName: vulnPackage.name
            }
          });

          if (existingVuln) {
            console.log(`[DepScheduler] Skipping duplicate: ${vuln.cveId} in ${vulnPackage.name}`);
            results.skipped++;
            continue;
          }

          // Save new vulnerability
          const savedVuln = await prisma.vuln.create({
            data: {
              repoId: repo.id,
              packageName: vulnPackage.name,
              version: vulnPackage.version,
              cveId: vuln.cveId,
              severity: vuln.severity,
              description: vuln.summary,
              fixVersion: vuln.fixedVersion || '',
              advisoryUrl: vuln.links && vuln.links.length > 0 ? vuln.links[0] : ''
            }
          });

          console.log(`[DepScheduler] Saved vulnerability: ${savedVuln.id} (${vuln.cveId})`);
          results.newVulns++;
        } catch (error) {
          console.error(`[DepScheduler] Error saving vulnerability ${vuln.cveId}:`, error.message);
          results.errors.push(`Failed to save ${vuln.cveId}: ${error.message}`);
        }
      }
    }

    results.scanned = true;
  } catch (error) {
    console.error(`[DepScheduler] Error scanning repository ${repo.id}:`, error.message);
    results.errors.push(`Repository scan failed: ${error.message}`);
  }

  return results;
};

/**
 * Run full dependency scan for all active repositories
 */
const runDependencyScan = async () => {
  try {
    console.log('[DepScheduler] ========================================');
    console.log(`[DepScheduler] Starting scheduled dependency scan at ${new Date().toISOString()}`);
    console.log('[DepScheduler] ========================================');

    // Fetch all active repositories
    const activeRepos = await prisma.repo.findMany({
      where: { status: 'ACTIVE' }
    });

    if (activeRepos.length === 0) {
      console.log('[DepScheduler] No active repositories to scan');
      return {
        timestamp: new Date().toISOString(),
        repositoriesScanned: 0,
        results: []
      };
    }

    console.log(`[DepScheduler] Found ${activeRepos.length} active repositories to scan`);

    const scanResults = [];
    let totalNewVulns = 0;
    let totalSkipped = 0;

    // Scan each repository
    for (const repo of activeRepos) {
      const result = await scanRepositoryDependencies(repo);
      scanResults.push(result);

      totalNewVulns += result.newVulns;
      totalSkipped += result.skipped;

      // Add a small delay between repos to avoid overwhelming APIs
      if (activeRepos.indexOf(repo) < activeRepos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      repositoriesScanned: activeRepos.length,
      totalPackagesFound: scanResults.reduce((sum, r) => sum + r.packagesFound, 0),
      totalVulnerabilitiesChecked: scanResults.reduce((sum, r) => sum + r.vulnerabilitiesChecked, 0),
      newVulnerabilitiesFound: totalNewVulns,
      duplicatesSkipped: totalSkipped,
      errors: scanResults.reduce((all, r) => all.concat(r.errors), []),
      results: scanResults
    };

    console.log('[DepScheduler] ========================================');
    console.log('[DepScheduler] Scan Complete Summary:');
    console.log(`  Repositories scanned: ${summary.repositoriesScanned}`);
    console.log(`  Packages found: ${summary.totalPackagesFound}`);
    console.log(`  Vulnerabilities checked: ${summary.totalVulnerabilitiesChecked}`);
    console.log(`  New vulnerabilities saved: ${summary.newVulnerabilitiesFound}`);
    console.log(`  Duplicates skipped: ${summary.duplicatesSkipped}`);
    console.log(`  Total errors: ${summary.errors.length}`);
    console.log('[DepScheduler] ========================================');

    return summary;
  } catch (error) {
    console.error('[DepScheduler] Critical error during dependency scan:', error);
    return {
      timestamp: new Date().toISOString(),
      error: error.message,
      repositoriesScanned: 0
    };
  }
};

/**
 * Initialize and start the dependency scheduler
 * Runs every 6 hours at 00:00, 06:00, 12:00, 18:00
 */
const startDependencyScheduler = () => {
  console.log('[DepScheduler] Initializing dependency scheduler');
  console.log('[DepScheduler] Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)');

  // Run every 6 hours at the specified times
  const task = cron.schedule('0 0,6,12,18 * * *', async () => {
    console.log('[DepScheduler] Cron job triggered');
    await runDependencyScan();
  });

  // Also allow manual trigger on startup (optional)
  // Uncomment to run on app start:
  // runDependencyScan().catch(error => {
  //   console.error('[DepScheduler] Initial scan failed:', error);
  // });

  console.log('[DepScheduler] Scheduler started successfully');
  return task;
};

/**
 * Stop the scheduler
 */
const stopDependencyScheduler = (task) => {
  if (task) {
    task.stop();
    console.log('[DepScheduler] Scheduler stopped');
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[DepScheduler] SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[DepScheduler] SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = {
  startDependencyScheduler,
  stopDependencyScheduler,
  runDependencyScan,
  scanRepositoryDependencies
};
