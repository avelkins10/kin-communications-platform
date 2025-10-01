/**
 * Phone number normalization utilities
 */

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX)
 * @param phone - The phone number to normalize
 * @returns Normalized phone number in E.164 format or null if invalid
 */
export function normalizePhoneToE164(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle empty string after cleaning
  if (!digitsOnly) return null;
  
  // Handle different formats
  if (digitsOnly.length === 10) {
    // Assume US number, add +1 prefix
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // US number with country code
    return `+${digitsOnly}`;
  } else if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    // International number, add + prefix
    return `+${digitsOnly}`;
  } else if (digitsOnly.length > 11) {
    // International number, add + prefix
    return `+${digitsOnly}`;
  }
  
  // Invalid length
  return null;
}

/**
 * Strip phone number to digits only
 * @param phone - The phone number to strip
 * @returns Phone number with only digits or null if invalid
 */
export function stripPhoneToDigits(phone: string): string | null {
  if (!phone) return null;
  
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly || null;
}

/**
 * Format phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    const withoutCountryCode = digitsOnly.slice(1);
    return `+1 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  }
  
  return phone; // Return original if can't format
}

/**
 * Validate if a phone number is valid
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Accept 10-digit (US), 11-digit (US with country code), or international
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Alias for isValidPhoneNumber for backward compatibility
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export const validatePhoneNumber = isValidPhoneNumber;

/**
 * Alias for normalizePhoneToE164 for backward compatibility
 * @param phone - The phone number to normalize
 * @returns Normalized phone number in E.164 format or null if invalid
 */
export const normalizePhoneNumber = normalizePhoneToE164;

/**
 * Get possible phone number formats for querying
 * Returns an array of normalized formats to try when searching
 * @param phone - The phone number to get formats for
 * @returns Array of possible phone formats
 */
export function getPhoneQueryFormats(phone: string): string[] {
  if (!phone) return [];
  
  const formats: string[] = [];
  const digitsOnly = stripPhoneToDigits(phone);
  
  if (!digitsOnly) return [];
  
  // Add original format
  formats.push(phone);
  
  // Add E.164 format
  const e164 = normalizePhoneToE164(phone);
  if (e164) {
    formats.push(e164);
  }
  
  // Add digits only
  formats.push(digitsOnly);
  
  // Add US format variations if applicable
  if (digitsOnly.length === 10) {
    formats.push(`1${digitsOnly}`); // With US country code
    formats.push(`+1${digitsOnly}`); // E.164 format
    formats.push(`(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`); // Display format
  }
  
  // Remove duplicates
  return [...new Set(formats)];
}

/**
 * Find a user by their phone number
 * @param phoneNumber - The phone number to search for
 * @returns User object if found, null otherwise
 */
export async function findUserByPhoneNumber(phoneNumber: string): Promise<any | null> {
  if (!phoneNumber) return null;
  
  try {
    // Import prisma dynamically to avoid circular dependencies
    const { prisma } = await import('@/lib/db');
    
    // Get all possible formats for the phone number
    const formats = getPhoneQueryFormats(phoneNumber);
    
    // Search for user with any of these phone number formats
    const user = await prisma.user.findFirst({
      where: {
        PhoneNumber: {
          some: {
            phoneNumber: {
              in: formats
            },
            status: 'active'
          }
        }
      },
      include: {
        PhoneNumber: {
          where: { status: 'active' }
        }
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error finding user by phone number:', error);
    return null;
  }
}