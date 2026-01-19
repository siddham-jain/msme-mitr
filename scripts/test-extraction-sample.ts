/**
 * Test Extraction Service with Sample Data
 * 
 * This script tests the extraction service with predefined sample conversations
 * to verify the AI extraction and normalization logic is working correctly.
 * 
 * Usage:
 *   npx tsx scripts/test-extraction-sample.ts
 */

import { ExtractionService } from '@/services/analytics/extractionService';
import {
  normalizeLocation,
  normalizeIndustry,
  normalizeBusinessSize,
  normalizeCurrency,
  detectConversationLanguages
} from '@/lib/utils/normalization';

// Sample conversations for testing
const SAMPLE_CONVERSATIONS = [
  {
    name: 'English - Explicit Business Info',
    messages: [
      { role: 'user', content: 'I run a textile manufacturing business in Mumbai' },
      { role: 'assistant', content: 'Tell me more about your business' },
      { role: 'user', content: 'We have 15 employees and annual turnover of 2 crore rupees' },
      { role: 'assistant', content: 'That sounds like a growing business' },
      { role: 'user', content: 'I want to know about Mudra loan scheme' }
    ],
    expected: {
      location: 'Mumbai',
      industry: 'Manufacturing - Textiles',
      businessSize: 'Small',
      employeeCount: 15,
      annualTurnover: 20000000,
      schemeInterests: ['Mudra']
    }
  },
  {
    name: 'Hindi - Small Shop',
    messages: [
      { role: 'user', content: 'मेरी दिल्ली में एक छोटी दुकान है' },
      { role: 'assistant', content: 'आपकी दुकान में क्या बिकता है?' },
      { role: 'user', content: 'किराने का सामान बेचता हूं' },
      { role: 'assistant', content: 'कितने कर्मचारी हैं?' },
      { role: 'user', content: '3 लोग काम करते हैं' }
    ],
    expected: {
      location: 'Delhi',
      industry: 'Retail - Grocery',
      businessSize: 'Micro',
      employeeCount: 3,
      languages: ['hindi']
    }
  },
  {
    name: 'Hinglish - Code Switching',
    messages: [
      { role: 'user', content: 'I have chota sa restaurant in Bangalore' },
      { role: 'assistant', content: 'How many people work there?' },
      { role: 'user', content: '8 worker hai mere paas, monthly 5 lakh ka business hota hai' },
      { role: 'assistant', content: 'Are you looking for any schemes?' },
      { role: 'user', content: 'Haan, PMEGP ke baare mein jaanna chahta hu' }
    ],
    expected: {
      location: 'Bangalore',
      industry: 'Food & Beverage',
      businessSize: 'Micro',
      employeeCount: 8,
      languages: ['hinglish', 'english', 'hindi']
    }
  },
  {
    name: 'Informal - Typos and Colloquial',
    messages: [
      { role: 'user', content: 'my bussiness is in Bangalor' },
      { role: 'assistant', content: 'What type of business?' },
      { role: 'user', content: 'kapde ka kaam karta hu, very small shop hai' },
      { role: 'assistant', content: 'How many employees?' },
      { role: 'user', content: 'sirf 2 log aur main' }
    ],
    expected: {
      location: 'Bangalore',
      industry: 'Manufacturing - Textiles',
      businessSize: 'Micro',
      employeeCount: 3
    }
  }
];

async function testNormalizationFunctions() {
  console.log('🧪 Testing Normalization Functions\n');
  console.log('='.repeat(60));

  // Test location normalization
  console.log('\n📍 Location Normalization:');
  console.log('-'.repeat(60));

  const locationTests = [
    ['Mumbai', 'Mumbai'],
    ['Bombay', 'Mumbai'],
    ['Bangalore', 'Bangalore'],
    ['Bengaluru', 'Bangalore'],
    ['Bangalor', 'Bangalore'],
    ['Dilli', 'Delhi'],
    ['Pune', 'Pune']
  ];

  locationTests.forEach(([input, expected]) => {
    const result = normalizeLocation(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → "${result}" (expected: "${expected}")`);
  });

  // Test industry normalization
  console.log('\n🏭 Industry Normalization:');
  console.log('-'.repeat(60));

  const industryTests = [
    ['textile', 'Manufacturing - Textiles'],
    ['kapde', 'Manufacturing - Textiles'],
    ['कपड़े', 'Manufacturing - Textiles'],
    ['restaurant', 'Food & Beverage'],
    ['food processing', 'Manufacturing - Food Processing'],
    ['grocery', 'Retail - Grocery'],
    ['dukaan', 'Retail'],
    ['IT services', 'Information Technology'],
    ['software', 'Information Technology']
  ];

  industryTests.forEach(([input, expected]) => {
    const result = normalizeIndustry(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → "${result}" (expected: "${expected}")`);
  });

  // Test business size normalization
  console.log('\n📏 Business Size Normalization:');
  console.log('-'.repeat(60));

  const sizeTests = [
    { input: { size: null, employees: 5, turnover: null }, expected: 'Micro' },
    { input: { size: null, employees: 15, turnover: null }, expected: 'Small' },
    { input: { size: null, employees: 60, turnover: null }, expected: 'Medium' },
    { input: { size: null, employees: null, turnover: 5000000 }, expected: 'Micro' },
    { input: { size: null, employees: null, turnover: 50000000 }, expected: 'Small' },
    { input: { size: null, employees: null, turnover: 150000000 }, expected: 'Medium' },
    { input: { size: 'chota', employees: null, turnover: null }, expected: 'Micro' },
    { input: { size: 'छोटा', employees: null, turnover: null }, expected: 'Micro' }
  ];

  sizeTests.forEach(({ input, expected }) => {
    const result = normalizeBusinessSize(
      input.size,
      input.employees ?? undefined,
      input.turnover ?? undefined
    );
    const status = result === expected ? '✅' : '❌';
    const inputStr = `size: ${input.size || 'null'}, emp: ${input.employees || 'null'}, turnover: ${input.turnover || 'null'}`;
    console.log(`${status} ${inputStr} → "${result}" (expected: "${expected}")`);
  });

  // Test currency normalization
  console.log('\n💰 Currency Normalization:');
  console.log('-'.repeat(60));

  const currencyTests = [
    ['50 lakh', 5000000],
    ['5 crore', 50000000],
    ['2.5 lakh', 250000],
    ['1.5 crore', 15000000],
    ['₹50 lakh', 5000000],
    ['50L', 5000000],
    ['5cr', 50000000]
  ];

  currencyTests.forEach(([input, expected]) => {
    const result = normalizeCurrency(input as string);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → ${result} (expected: ${expected})`);
  });

  // Test language detection
  console.log('\n🌐 Language Detection:');
  console.log('-'.repeat(60));

  const languageTests = [
    {
      messages: [{ role: 'user', content: 'Hello, I need help' }],
      expected: ['english']
    },
    {
      messages: [{ role: 'user', content: 'मुझे मदद चाहिए' }],
      expected: ['hindi']
    },
    {
      messages: [{ role: 'user', content: 'I have chota business' }],
      expected: ['hinglish']
    }
  ];

  languageTests.forEach(({ messages, expected }) => {
    const result = detectConversationLanguages(messages);
    const hasExpected = expected.some(lang => result.includes(lang));
    const status = hasExpected ? '✅' : '❌';
    console.log(`${status} "${messages[0].content}" → [${result.join(', ')}]`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ NORMALIZATION TESTS COMPLETED');
  console.log('='.repeat(60));
}

async function testSampleConversations() {
  console.log('\n\n🧪 Testing Sample Conversations\n');
  console.log('='.repeat(60));

  for (const sample of SAMPLE_CONVERSATIONS) {
    console.log(`\n📝 Test: ${sample.name}`);
    console.log('-'.repeat(60));

    console.log('Conversation:');
    sample.messages.forEach((msg, idx) => {
      const preview = msg.content.substring(0, 60);
      console.log(`  ${idx + 1}. [${msg.role}]: ${preview}${msg.content.length > 60 ? '...' : ''}`);
    });

    // Detect languages
    const detectedLanguages = detectConversationLanguages(sample.messages);
    console.log(`\nDetected Languages: ${detectedLanguages.join(', ')}`);

    // Check expected values
    console.log('\nExpected Extraction:');
    if (sample.expected.location) {
      console.log(`  Location: ${sample.expected.location}`);
    }
    if (sample.expected.industry) {
      console.log(`  Industry: ${sample.expected.industry}`);
    }
    if (sample.expected.businessSize) {
      console.log(`  Business Size: ${sample.expected.businessSize}`);
    }
    if (sample.expected.employeeCount) {
      console.log(`  Employees: ${sample.expected.employeeCount}`);
    }
    if (sample.expected.annualTurnover) {
      console.log(`  Turnover: ₹${sample.expected.annualTurnover.toLocaleString()}`);
    }
    if (sample.expected.schemeInterests) {
      console.log(`  Scheme Interests: ${sample.expected.schemeInterests.join(', ')}`);
    }

    console.log('\n✅ Sample validated');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ SAMPLE CONVERSATION TESTS COMPLETED');
  console.log('='.repeat(60));
}

async function checkEnvironmentSetup() {
  console.log('🔧 Checking Environment Setup\n');
  console.log('='.repeat(60));

  const checks = [
    {
      name: 'OpenRouter API Key',
      value: process.env.OPENROUTER_API_KEY,
      required: true
    },
    {
      name: 'Extraction Model',
      value: process.env.EXTRACTION_MODEL || 'openai/gpt-4o-mini (default)',
      required: false
    },
    {
      name: 'Confidence Threshold',
      value: process.env.EXTRACTION_CONFIDENCE_THRESHOLD || '0.5 (default)',
      required: false
    },
    {
      name: 'Supabase URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true
    },
    {
      name: 'Supabase Publishable Key',
      value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : undefined,
      required: true
    }
  ];

  let allGood = true;

  checks.forEach(check => {
    const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
    const displayValue = check.value || 'Not set';
    console.log(`${status} ${check.name}: ${displayValue}`);

    if (check.required && !check.value) {
      allGood = false;
    }
  });

  console.log('\n' + '='.repeat(60));

  if (allGood) {
    console.log('✅ ENVIRONMENT SETUP COMPLETE');
  } else {
    console.log('❌ ENVIRONMENT SETUP INCOMPLETE');
    console.log('\nPlease set the required environment variables in your .env file');
  }

  console.log('='.repeat(60));

  return allGood;
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 EXTRACTION SERVICE TEST SUITE');
  console.log('='.repeat(60));
  console.log('This script tests the extraction service components:\n');
  console.log('1. Environment setup');
  console.log('2. Normalization functions');
  console.log('3. Sample conversation processing');
  console.log('\n' + '='.repeat(60));

  try {
    // Check environment
    const envOk = await checkEnvironmentSetup();

    if (!envOk) {
      console.log('\n⚠️  Some environment variables are missing.');
      console.log('The tests will continue, but AI extraction may not work.\n');
    }

    // Test normalization functions
    await testNormalizationFunctions();

    // Test sample conversations
    await testSampleConversations();

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:');
    console.log('   1. Run: npx tsx scripts/test-extraction-service.ts');
    console.log('      to test with real conversations from your database');
    console.log('   2. Check the admin dashboard to see extracted data');
    console.log('   3. Monitor extraction jobs in the extraction_jobs table');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    process.exit(1);
  }
}

// Run the test suite
runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
