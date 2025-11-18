/**
 * OpenRouter AI Service
 * Handles all LLM interactions for MSME Mitr
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

function getApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables')
  }
  return apiKey
}

function getModel() {
  return process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: Message[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

/**
 * Make a chat completion request to OpenRouter
 */
export async function chatCompletion(options: ChatCompletionOptions) {
  const {
    messages,
    temperature = 0.7,
    max_tokens = 1000,
    stream = false
  } = options

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://msme-mitr.vercel.app', // Optional: for rankings
      'X-Title': 'MSME Mitr' // Optional: for rankings
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature,
      max_tokens,
      stream
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  if (stream) {
    return response.body
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * System prompt for MSME advisory conversations
 */
export const MSME_SYSTEM_PROMPT = `You are an AI assistant for MSME Mitr, a government scheme advisory system for Micro, Small, and Medium Enterprises in India.

Your role:
- Help MSME owners discover relevant government schemes
- Answer questions about scheme eligibility, benefits, and application processes
- Extract business information naturally during conversation (sector, size, location, turnover, employees)
- Be professional, helpful, and empathetic
- Use simple language (many users may not be fluent in English)
- Focus on actionable advice

Guidelines:
- Ask clarifying questions to understand business needs
- Recommend 3-5 most relevant schemes based on user profile
- Explain eligibility criteria clearly
- Provide step-by-step application guidance when asked
- If unsure about scheme details, say so (don't hallucinate)
- Encourage users to verify information on official government websites

Context:
- You have access to 500+ Indian government schemes
- Schemes vary by sector, business size, state, turnover, and employee count
- Common sectors: Manufacturing, Services, Agriculture, Technology, Retail
- Business sizes: Micro (< ₹1 Cr turnover), Small (₹1-10 Cr), Medium (₹10-50 Cr)`

/**
 * Generate embeddings for text (for vector search)
 * Uses OpenRouter's text-embedding-ada-002 or similar
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-ada-002',
      input: text
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Embedding API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Extract user business attributes from conversation
 * Returns structured data about the user's business
 */
export async function extractUserAttributes(conversationHistory: Message[]) {
  const extractionPrompt = `Analyze the conversation and extract the user's business attributes.

Return a JSON object with the following fields (use null if not mentioned):
{
  "business_name": string | null,
  "business_sector": string | null,  // e.g., "Manufacturing", "Services", "Technology"
  "business_size": "Micro" | "Small" | "Medium" | null,
  "state": string | null,  // Indian state name
  "district": string | null,
  "annual_turnover": number | null,  // in rupees
  "employee_count": number | null,
  "registration_year": number | null,
  "needs": string[] | null  // Array of business needs/challenges mentioned
}

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Return ONLY valid JSON, no markdown or explanation.`

  const response = await chatCompletion({
    messages: [
      { role: 'system', content: 'You are a data extraction assistant. Return only valid JSON.' },
      { role: 'user', content: extractionPrompt }
    ],
    temperature: 0.1, // Low temperature for consistent extraction
    max_tokens: 500
  })

  try {
    // Remove markdown code blocks if present
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanedResponse)
  } catch (error) {
    console.error('Failed to parse extracted attributes:', error)
    return null
  }
}

/**
 * Generate a conversational response with scheme recommendations
 */
export async function generateSchemeRecommendation(
  userQuery: string,
  userProfile: any,
  relevantSchemes: any[]
) {
  const schemesContext = relevantSchemes.map((scheme, idx) => `
${idx + 1}. **${scheme.name}**
   - Ministry: ${scheme.ministry}
   - Target: ${scheme.target_business_size?.join(', ')} businesses in ${scheme.target_sector?.join(', ')}
   - Eligibility: ${typeof scheme.eligibility === 'string' ? scheme.eligibility : JSON.stringify(scheme.eligibility)}
   - Benefits: ${scheme.benefits}
   - Application: ${scheme.application_process}
   - Official URL: ${scheme.official_url}
`).join('\n')

  const prompt = `User Query: "${userQuery}"

User Profile:
- Business Sector: ${userProfile.business_sector || 'Not specified'}
- Business Size: ${userProfile.business_size || 'Not specified'}
- State: ${userProfile.state || 'Not specified'}
- Annual Turnover: ${userProfile.annual_turnover ? `₹${(userProfile.annual_turnover / 10000000).toFixed(2)} Cr` : 'Not specified'}
- Employees: ${userProfile.employee_count || 'Not specified'}

Relevant Schemes:
${schemesContext}

Provide a helpful, conversational response that:
1. Acknowledges the user's query
2. Recommends the top 2-3 most relevant schemes from the list above
3. Explains WHY each scheme is relevant to their business
4. Highlights key benefits and eligibility criteria
5. Suggests next steps (how to apply, documents needed)
6. Asks if they want more details about any specific scheme

Keep the tone friendly and professional. Use bullet points and formatting for readability.`

  return await chatCompletion({
    messages: [
      { role: 'system', content: MSME_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500
  })
}

/**
 * Generate embeddings for all schemes (to be run once during seeding)
 */
export async function generateSchemeEmbeddings(schemes: any[]) {
  const embeddings = []

  for (const scheme of schemes) {
    try {
      // Create a comprehensive text representation of the scheme
      const schemeText = `
        ${scheme.name}
        ${scheme.ministry}
        ${scheme.description}
        Sectors: ${scheme.target_sector?.join(', ') || ''}
        Business Size: ${scheme.target_business_size?.join(', ') || ''}
        Benefits: ${scheme.benefits}
        State: ${scheme.state_specific || 'All India'}
      `.trim()

      const embedding = await generateEmbedding(schemeText)

      embeddings.push({
        id: scheme.id,
        embedding
      })

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log(`✓ Generated embedding for: ${scheme.name}`)
    } catch (error) {
      console.error(`✗ Failed to generate embedding for ${scheme.name}:`, error)
    }
  }

  return embeddings
}
