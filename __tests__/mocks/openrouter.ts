/**
 * OpenRouter AI Service Mocks
 * Mock implementations for AI chat and embedding generation
 */

export const mockChatCompletion = jest.fn().mockResolvedValue(
  'This is a mock AI response from Claude. I can help you with MSME schemes and business guidance.'
)

export const mockGenerateEmbedding = jest.fn().mockResolvedValue(
  Array.from({ length: 1536 }, () => Math.random())
)

export const mockRecommendSchemes = jest.fn().mockResolvedValue([
  {
    id: 'scheme-1',
    scheme_name: 'Credit Guarantee Fund Scheme',
    ministry: 'Ministry of MSME',
    description: 'Collateral-free loans for MSMEs',
    similarity: 0.85,
  },
  {
    id: 'scheme-2',
    scheme_name: 'Technology Upgradation Fund',
    ministry: 'Ministry of Textiles',
    description: 'Financial assistance for technology upgradation',
    similarity: 0.78,
  },
])

// Mock the entire openrouter module
jest.mock('@/lib/ai/openrouter', () => ({
  chatCompletion: mockChatCompletion,
  generateEmbedding: mockGenerateEmbedding,
  recommendSchemes: mockRecommendSchemes,
  MSME_SYSTEM_PROMPT: 'You are an AI assistant for MSME Mitr...',
}))
