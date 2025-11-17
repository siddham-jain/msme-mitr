/**
 * Data Normalization Utilities for Analytics Extraction
 * 
 * Handles normalization of multilingual data to standardized English formats:
 * - Location names
 * - Industry categories
 * - Currency conversions (lakhs, crores)
 * - Business size indicators
 */

// ============================================================================
// Location Normalization
// ============================================================================

const LOCATION_MAPPINGS: Record<string, string> = {
  // Major cities with common variations
  'mumbai': 'Mumbai',
  'bombay': 'Mumbai',
  'मुंबई': 'Mumbai',
  
  'delhi': 'Delhi',
  'dilli': 'Delhi',
  'दिल्ली': 'Delhi',
  'new delhi': 'Delhi',
  
  'bangalore': 'Bangalore',
  'bengaluru': 'Bangalore',
  'bangalor': 'Bangalore',
  'bangaluru': 'Bangalore',
  'बेंगलुरु': 'Bangalore',
  
  'kolkata': 'Kolkata',
  'calcutta': 'Kolkata',
  'कोलकाता': 'Kolkata',
  
  'chennai': 'Chennai',
  'madras': 'Chennai',
  'चेन्नई': 'Chennai',
  
  'hyderabad': 'Hyderabad',
  'हैदराबाद': 'Hyderabad',
  
  'pune': 'Pune',
  'पुणे': 'Pune',
  
  'ahmedabad': 'Ahmedabad',
  'amdavad': 'Ahmedabad',
  'अहमदाबाद': 'Ahmedabad',
  
  'jaipur': 'Jaipur',
  'जयपुर': 'Jaipur',
  
  'lucknow': 'Lucknow',
  'लखनऊ': 'Lucknow',
  
  'kanpur': 'Kanpur',
  'कानपुर': 'Kanpur',
  
  'nagpur': 'Nagpur',
  'नागपुर': 'Nagpur',
  
  'indore': 'Indore',
  'इंदौर': 'Indore',
  
  'bhopal': 'Bhopal',
  'भोपाल': 'Bhopal',
  
  'visakhapatnam': 'Visakhapatnam',
  'vizag': 'Visakhapatnam',
  
  'patna': 'Patna',
  'पटना': 'Patna',
  
  'vadodara': 'Vadodara',
  'baroda': 'Vadodara',
  
  'ghaziabad': 'Ghaziabad',
  'गाजियाबाद': 'Ghaziabad',
  
  'ludhiana': 'Ludhiana',
  'लुधियाना': 'Ludhiana',
  
  'agra': 'Agra',
  'आगरा': 'Agra',
  
  'nashik': 'Nashik',
  'नाशिक': 'Nashik',
  
  'faridabad': 'Faridabad',
  'फरीदाबाद': 'Faridabad',
  
  'meerut': 'Meerut',
  'मेरठ': 'Meerut',
  
  'rajkot': 'Rajkot',
  'राजकोट': 'Rajkot',
  
  'varanasi': 'Varanasi',
  'banaras': 'Varanasi',
  'वाराणसी': 'Varanasi',
  
  'srinagar': 'Srinagar',
  'श्रीनगर': 'Srinagar',
  
  'amritsar': 'Amritsar',
  'अमृतसर': 'Amritsar',
  
  'chandigarh': 'Chandigarh',
  'चंडीगढ़': 'Chandigarh',
  
  'coimbatore': 'Coimbatore',
  'कोयंबटूर': 'Coimbatore',
  
  'kochi': 'Kochi',
  'cochin': 'Kochi',
  'कोच्चि': 'Kochi',
};

/**
 * Normalize location name to standard English format
 */
export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  
  const normalized = location.trim().toLowerCase();
  
  // Check direct mapping
  if (LOCATION_MAPPINGS[normalized]) {
    return LOCATION_MAPPINGS[normalized];
  }
  
  // Check if any mapping key is contained in the location string
  for (const [key, value] of Object.entries(LOCATION_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Return capitalized version if no mapping found
  return location
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ============================================================================
// Industry Normalization
// ============================================================================

const INDUSTRY_MAPPINGS: Record<string, string> = {
  // Manufacturing
  'textile': 'Manufacturing - Textiles',
  'textiles': 'Manufacturing - Textiles',
  'kapde': 'Manufacturing - Textiles',
  'कपड़े': 'Manufacturing - Textiles',
  'garment': 'Manufacturing - Textiles',
  'fabric': 'Manufacturing - Textiles',
  'cloth': 'Manufacturing - Textiles',
  
  'food processing': 'Manufacturing - Food Processing',
  'food': 'Manufacturing - Food Processing',
  'खाना': 'Manufacturing - Food Processing',
  'खाद्य': 'Manufacturing - Food Processing',
  
  'electronics': 'Manufacturing - Electronics',
  'electronic': 'Manufacturing - Electronics',
  'इलेक्ट्रॉनिक्स': 'Manufacturing - Electronics',
  
  'chemical': 'Manufacturing - Chemicals',
  'chemicals': 'Manufacturing - Chemicals',
  'रसायन': 'Manufacturing - Chemicals',
  
  'pharmaceutical': 'Manufacturing - Pharmaceuticals',
  'pharma': 'Manufacturing - Pharmaceuticals',
  'medicine': 'Manufacturing - Pharmaceuticals',
  'दवा': 'Manufacturing - Pharmaceuticals',
  
  'furniture': 'Manufacturing - Furniture',
  'फर्नीचर': 'Manufacturing - Furniture',
  
  'leather': 'Manufacturing - Leather',
  'चमड़ा': 'Manufacturing - Leather',
  
  'plastic': 'Manufacturing - Plastics',
  'plastics': 'Manufacturing - Plastics',
  'प्लास्टिक': 'Manufacturing - Plastics',
  
  'metal': 'Manufacturing - Metal Products',
  'metals': 'Manufacturing - Metal Products',
  'धातु': 'Manufacturing - Metal Products',
  
  // Retail
  'retail': 'Retail',
  'shop': 'Retail',
  'dukaan': 'Retail',
  'दुकान': 'Retail',
  'store': 'Retail',
  
  'grocery': 'Retail - Grocery',
  'kirana': 'Retail - Grocery',
  'किराना': 'Retail - Grocery',
  
  'clothing': 'Retail - Clothing',
  'clothes': 'Retail - Clothing',
  
  'electronics shop': 'Retail - Electronics',
  
  // Food & Beverage
  'restaurant': 'Food & Beverage',
  'hotel': 'Food & Beverage',
  'dhaba': 'Food & Beverage',
  'ढाबा': 'Food & Beverage',
  'cafe': 'Food & Beverage',
  'bakery': 'Food & Beverage',
  'catering': 'Food & Beverage',
  
  // Services
  'it': 'Information Technology',
  'software': 'Information Technology',
  'tech': 'Information Technology',
  'technology': 'Information Technology',
  'सॉफ्टवेयर': 'Information Technology',
  
  'consulting': 'Professional Services',
  'consultant': 'Professional Services',
  'परामर्श': 'Professional Services',
  
  'education': 'Education & Training',
  'training': 'Education & Training',
  'coaching': 'Education & Training',
  'शिक्षा': 'Education & Training',
  
  'healthcare': 'Healthcare',
  'health': 'Healthcare',
  'clinic': 'Healthcare',
  'स्वास्थ्य': 'Healthcare',
  
  'salon': 'Personal Services',
  'beauty': 'Personal Services',
  'parlor': 'Personal Services',
  'parlour': 'Personal Services',
  
  'repair': 'Repair & Maintenance',
  'maintenance': 'Repair & Maintenance',
  'मरम्मत': 'Repair & Maintenance',
  
  // Construction
  'construction': 'Construction',
  'निर्माण': 'Construction',
  'builder': 'Construction',
  'contractor': 'Construction',
  
  // Agriculture
  'agriculture': 'Agriculture',
  'farming': 'Agriculture',
  'खेती': 'Agriculture',
  'कृषि': 'Agriculture',
  'agri': 'Agriculture',
  
  // Transport
  'transport': 'Transportation & Logistics',
  'logistics': 'Transportation & Logistics',
  'परिवहन': 'Transportation & Logistics',
  'delivery': 'Transportation & Logistics',
  
  // Trading
  'trading': 'Trading & Distribution',
  'wholesale': 'Trading & Distribution',
  'व्यापार': 'Trading & Distribution',
  'distributor': 'Trading & Distribution',
};

/**
 * Normalize industry name to standard category
 */
export function normalizeIndustry(industry: string | null | undefined): string | null {
  if (!industry) return null;
  
  const normalized = industry.trim().toLowerCase();
  
  // Check direct mapping
  if (INDUSTRY_MAPPINGS[normalized]) {
    return INDUSTRY_MAPPINGS[normalized];
  }
  
  // Check if any mapping key is contained in the industry string
  for (const [key, value] of Object.entries(INDUSTRY_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Return capitalized version if no mapping found
  return industry
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ============================================================================
// Currency Normalization
// ============================================================================

/**
 * Convert Indian currency mentions to numeric INR
 * Handles: lakhs, crores, thousands, k, L, cr
 */
export function normalizeCurrency(currencyString: string | null | undefined): number | null {
  if (!currencyString) return null;
  
  const normalized = currencyString.toLowerCase().trim();
  
  // Remove currency symbols and common words
  const cleaned = normalized
    .replace(/₹|rs\.?|rupees?|रुपये?/gi, '')
    .trim();
  
  // Extract number and unit
  const lakhMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l|लाख)/i);
  if (lakhMatch) {
    return parseFloat(lakhMatch[1]) * 100000;
  }
  
  const croreMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr|करोड़)/i);
  if (croreMatch) {
    return parseFloat(croreMatch[1]) * 10000000;
  }
  
  const thousandMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k|हजार)/i);
  if (thousandMatch) {
    return parseFloat(thousandMatch[1]) * 1000;
  }
  
  // Try to parse as plain number
  const numberMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }
  
  return null;
}

// ============================================================================
// Business Size Normalization
// ============================================================================

type BusinessSize = 'Micro' | 'Small' | 'Medium';

const BUSINESS_SIZE_KEYWORDS: Record<BusinessSize, string[]> = {
  'Micro': [
    'micro', 'chota', 'छोटा', 'small', 'nano', 'solo', 'tiny',
    'very small', 'bahut chota', 'बहुत छोटा', 'single person',
    'one man', 'alone', 'अकेला'
  ],
  'Small': [
    'small', 'madhyam', 'मध्यम', 'growing', 'few employees',
    'small-medium', 'developing', 'thoda bada', 'थोड़ा बड़ा'
  ],
  'Medium': [
    'medium', 'bada', 'बड़ा', 'large', 'established', 'big',
    'kaafi bada', 'काफी बड़ा', 'well established'
  ]
};

/**
 * Normalize business size indicator
 */
export function normalizeBusinessSize(
  sizeString: string | null | undefined,
  employeeCount?: number | null,
  annualTurnover?: number | null
): BusinessSize | null {
  // If we have numeric indicators, use those first
  if (employeeCount !== null && employeeCount !== undefined) {
    if (employeeCount <= 10) return 'Micro';
    if (employeeCount <= 50) return 'Small';
    return 'Medium';
  }
  
  if (annualTurnover !== null && annualTurnover !== undefined) {
    // MSME classification based on turnover (in INR)
    if (annualTurnover <= 10000000) return 'Micro'; // Up to 1 crore
    if (annualTurnover <= 100000000) return 'Small'; // Up to 10 crore
    return 'Medium'; // Above 10 crore
  }
  
  // Otherwise, use keyword matching
  if (!sizeString) return null;
  
  const normalized = sizeString.toLowerCase().trim();
  
  // Check each size category
  for (const [size, keywords] of Object.entries(BUSINESS_SIZE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return size as BusinessSize;
      }
    }
  }
  
  return null;
}

// ============================================================================
// Employee Count Normalization
// ============================================================================

/**
 * Extract and normalize employee count from text
 */
export function normalizeEmployeeCount(countString: string | null | undefined): number | null {
  if (!countString) return null;
  
  const normalized = countString.toLowerCase().trim();
  
  // Handle special cases
  if (normalized.match(/alone|solo|single|one man|अकेला|koi nahi/i)) {
    return 1;
  }
  
  // Handle ranges (take average)
  const rangeMatch = normalized.match(/(\d+)\s*[-–to]\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    return Math.round((min + max) / 2);
  }
  
  // Extract plain number
  const numberMatch = normalized.match(/(\d+)\s*(?:log|workers?|employees?|कर्मचारी|लोग)?/i);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  return null;
}

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detect languages used in text
 */
export function detectLanguages(text: string): string[] {
  const languages: Set<string> = new Set();
  
  // Check for Hindi (Devanagari script)
  if (/[\u0900-\u097F]/.test(text)) {
    languages.add('hindi');
  }
  
  // Check for English
  if (/[a-zA-Z]/.test(text)) {
    languages.add('english');
  }
  
  // Check for Hinglish (mix of both)
  if (languages.has('hindi') && languages.has('english')) {
    languages.add('hinglish');
  }
  
  // Check for other Indian scripts
  if (/[\u0980-\u09FF]/.test(text)) languages.add('bengali');
  if (/[\u0A00-\u0A7F]/.test(text)) languages.add('punjabi');
  if (/[\u0A80-\u0AFF]/.test(text)) languages.add('gujarati');
  if (/[\u0B00-\u0B7F]/.test(text)) languages.add('oriya');
  if (/[\u0B80-\u0BFF]/.test(text)) languages.add('tamil');
  if (/[\u0C00-\u0C7F]/.test(text)) languages.add('telugu');
  if (/[\u0C80-\u0CFF]/.test(text)) languages.add('kannada');
  if (/[\u0D00-\u0D7F]/.test(text)) languages.add('malayalam');
  
  return Array.from(languages);
}

/**
 * Detect languages from conversation history
 */
export function detectConversationLanguages(
  messages: Array<{ content: string }>
): string[] {
  const allLanguages = new Set<string>();
  
  messages.forEach(msg => {
    const languages = detectLanguages(msg.content);
    languages.forEach(lang => allLanguages.add(lang));
  });
  
  return Array.from(allLanguages);
}
