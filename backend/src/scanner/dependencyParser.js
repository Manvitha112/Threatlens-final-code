/**
 * Dependency parser for ThreatLens
 * Parses package manifest files to extract dependencies
 */

/**
 * Parse package.json content and extract dependencies
 * @param {string} content - Contents of package.json file
 * @returns {Array} Array of { name, version } objects
 */
const parsePackageJson = (content) => {
  const dependencies = [];

  try {
    const packageJson = JSON.parse(content);
    
    // Extract dependencies
    if (packageJson.dependencies && typeof packageJson.dependencies === 'object') {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version: cleanVersionString(version),
          type: 'dependency'
        });
      }
    }

    // Extract devDependencies
    if (packageJson.devDependencies && typeof packageJson.devDependencies === 'object') {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version: cleanVersionString(version),
          type: 'devDependency'
        });
      }
    }

    // Extract peerDependencies (optional)
    if (packageJson.peerDependencies && typeof packageJson.peerDependencies === 'object') {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        dependencies.push({
          name,
          version: cleanVersionString(version),
          type: 'peerDependency'
        });
      }
    }

    // Extract optionalDependencies
    if (packageJson.optionalDependencies && typeof packageJson.optionalDependencies === 'object') {
      for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
        dependencies.push({
          name,
          version: cleanVersionString(version),
          type: 'optionalDependency'
        });
      }
    }

    return dependencies;
  } catch (error) {
    console.error('Error parsing package.json:', error.message);
    return [];
  }
};

/**
 * Parse requirements.txt content and extract dependencies
 * Supports formats: package==1.0.0, package>=1.0.0, package~=1.0.0, package>=1.0.0,<2.0.0
 * @param {string} content - Contents of requirements.txt file
 * @returns {Array} Array of { name, version } objects
 */
const parseRequirementsTxt = (content) => {
  const dependencies = [];

  try {
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Skip lines with only flags (e.g., -e, -r, --requirement)
      if (trimmedLine.startsWith('-')) {
        continue;
      }

      // Skip lines with URLs
      if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://') || trimmedLine.startsWith('git+')) {
        continue;
      }

      // Parse package name and version
      const dep = parseRequirementLine(trimmedLine);
      if (dep) {
        dependencies.push(dep);
      }
    }

    return dependencies;
  } catch (error) {
    console.error('Error parsing requirements.txt:', error.message);
    return [];
  }
};

/**
 * Parse a single requirement line
 * Formats: package==1.0.0, package>=1.0.0, package~=1.0.0, package[extra]==1.0.0
 * @param {string} line - Single requirement line
 * @returns {object|null} { name, version } or null if invalid
 */
const parseRequirementLine = (line) => {
  // Remove comments from end of line
  const commentIndex = line.indexOf('#');
  let cleanLine = commentIndex > -1 ? line.substring(0, commentIndex).trim() : line.trim();

  // Handle extras (e.g., package[extra1,extra2]==1.0.0)
  cleanLine = cleanLine.replace(/\[.*?\]/g, '');

  // Split on version operators
  let name = '';
  let version = '';

  // Try == first (exact version)
  if (cleanLine.includes('==')) {
    [name, version] = cleanLine.split('==');
    version = version.trim();
  }
  // Try >= (minimum version)
  else if (cleanLine.includes('>=')) {
    const parts = cleanLine.split('>=');
    name = parts[0];
    version = parts[1];
    
    // If there are more operators, take first version spec
    const commaIndex = version.indexOf(',');
    if (commaIndex > -1) {
      version = version.substring(0, commaIndex);
    }
    version = version.trim();
  }
  // Try ~= (compatible release)
  else if (cleanLine.includes('~=')) {
    [name, version] = cleanLine.split('~=');
    version = version.trim();
  }
  // Try > (greater than)
  else if (cleanLine.includes('>')) {
    const parts = cleanLine.split('>');
    name = parts[0];
    version = parts[1];
    const commaIndex = version.indexOf(',');
    if (commaIndex > -1) {
      version = version.substring(0, commaIndex);
    }
    version = version.trim();
  }
  // Try < (less than)
  else if (cleanLine.includes('<')) {
    const parts = cleanLine.split('<');
    name = parts[0];
    version = parts[1];
    const commaIndex = version.indexOf(',');
    if (commaIndex > -1) {
      version = version.substring(0, commaIndex);
    }
    version = version.trim();
  }
  // Try != (not equal)
  else if (cleanLine.includes('!=')) {
    [name, version] = cleanLine.split('!=');
    version = version.trim();
  }
  // No version specified
  else {
    name = cleanLine;
    version = '';
  }

  name = name.trim();

  if (!name) {
    return null;
  }

  return {
    name,
    version: version || '*',
    type: 'dependency'
  };
};

/**
 * Clean version string by removing npm version prefixes
 * Removes: ^1.0.0 -> 1.0.0, ~1.0.0 -> 1.0.0
 * @param {string} versionString - Version string with possible prefixes
 * @returns {string} Cleaned version string
 */
const cleanVersionString = (versionString) => {
  if (!versionString || typeof versionString !== 'string') {
    return '*';
  }

  return versionString
    .replace(/^[\^~>=<*]+/, '') // Remove prefix operators
    .trim();
};

/**
 * Compare two version strings
 * Simple semantic versioning comparison
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
 */
const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(p => parseInt(p) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
};

module.exports = {
  parsePackageJson,
  parseRequirementsTxt,
  parseRequirementLine,
  cleanVersionString,
  compareVersions
};
