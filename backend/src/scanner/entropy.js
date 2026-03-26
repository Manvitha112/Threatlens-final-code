/**
 * Calculate Shannon entropy of a string
 * Shannon entropy measures the randomness/disorder in a string
 * Formula: H(X) = -Σ p(x) * log2(p(x)) for each unique character
 * 
 * @param {string} str - Input string to calculate entropy for
 * @returns {number} Entropy value between 0 and 8
 *                   Higher entropy (>3.5) suggests random data like secrets/tokens
 */
const calculateEntropy = (str) => {
  // Validate input
  if (typeof str !== 'string' || str.length === 0) {
    return 0;
  }

  // Count frequency of each character
  const charFrequency = {};
  
  for (const char of str) {
    charFrequency[char] = (charFrequency[char] || 0) + 1;
  }

  // Calculate probability and entropy for each character
  let entropy = 0;
  const stringLength = str.length;

  for (const char in charFrequency) {
    // Calculate probability of this character
    const probability = charFrequency[char] / stringLength;

    // Shannon entropy formula: -(p * log2(p))
    entropy += -(probability * Math.log2(probability));
  }

  // Return entropy rounded to 2 decimal places
  return Math.round(entropy * 100) / 100;
};

/**
 * Determine if a string has high entropy (likely a secret/token)
 * @param {string} str - Input string to check
 * @param {number} threshold - Entropy threshold (default: 3.5)
 * @returns {boolean} True if entropy is above threshold
 */
const isHighEntropy = (str, threshold = 3.5) => {
  const entropy = calculateEntropy(str);
  return entropy > threshold;
};

/**
 * Get entropy classification
 * @param {string} str - Input string to classify
 * @returns {object} { entropy, classification, suspicionLevel }
 */
const classifyEntropy = (str) => {
  const entropy = calculateEntropy(str);

  let classification = '';
  let suspicionLevel = '';

  if (entropy < 2) {
    classification = 'Low entropy (mostly repetitive characters)';
    suspicionLevel = 'low';
  } else if (entropy < 3) {
    classification = 'Moderate entropy (some randomness)';
    suspicionLevel = 'medium';
  } else if (entropy < 4) {
    classification = 'High entropy (likely random/secret)';
    suspicionLevel = 'high';
  } else {
    classification = 'Very high entropy (highly random/secret)';
    suspicionLevel = 'critical';
  }

  return {
    entropy,
    classification,
    suspicionLevel,
    isLikelySecret: entropy > 3.5
  };
};

module.exports = {
  calculateEntropy,
  isHighEntropy,
  classifyEntropy
};
