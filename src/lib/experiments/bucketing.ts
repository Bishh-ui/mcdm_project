/**
 * User bucketing system for A/B experiments
 * Uses consistent hashing to ensure stable assignments
 */

/**
 * Simple hash function (FNV-1a)
 */
function hash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Assign user to a variant based on consistent hashing
 * @param userId - Unique user identifier
 * @param experimentId - Experiment identifier
 * @param variants - Array of variant configs with traffic allocation
 * @returns Assigned variant ID
 */
export function assignVariant(
  userId: string,
  experimentId: string,
  variants: Array<{ id: string; trafficAllocation: number }>
): string {
  // Create a stable hash key
  const hashKey = `${experimentId}:${userId}`;
  const hashValue = hash(hashKey);

  // Normalize to 0-100 range
  const bucket = (hashValue % 10000) / 100;

  // Find which variant this bucket falls into
  let cumulativeAllocation = 0;
  for (const variant of variants) {
    cumulativeAllocation += variant.trafficAllocation;
    if (bucket < cumulativeAllocation) {
      return variant.id;
    }
  }

  // Fallback to last variant (should never happen if allocations sum to 100)
  return variants[variants.length - 1].id;
}

/**
 * Check if user is in experiment (based on traffic allocation)
 */
export function isUserInExperiment(
  userId: string,
  experimentId: string,
  totalTrafficAllocation: number
): boolean {
  const hashKey = `${experimentId}:${userId}`;
  const hashValue = hash(hashKey);
  const bucket = (hashValue % 10000) / 100;

  return bucket < totalTrafficAllocation;
}

/**
 * Get stable bucket number for user (0-99)
 * Useful for gradual rollouts
 */
export function getUserBucket(userId: string, experimentId: string): number {
  const hashKey = `${experimentId}:${userId}`;
  const hashValue = hash(hashKey);
  return Math.floor((hashValue % 10000) / 100);
}

/**
 * Validate variant traffic allocations
 */
export function validateTrafficAllocations(
  variants: Array<{ id: string; trafficAllocation: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check each variant has valid allocation
  for (const variant of variants) {
    if (variant.trafficAllocation < 0 || variant.trafficAllocation > 100) {
      errors.push(
        `Variant ${variant.id} has invalid traffic allocation: ${variant.trafficAllocation}%`
      );
    }
  }

  // Check total allocation
  const total = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
  if (Math.abs(total - 100) > 0.01) {
    errors.push(`Total traffic allocation is ${total}%, must equal 100%`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
