# Analytics Services

This directory contains services for extracting and analyzing user data from MSME chatbot conversations.

## Overview

The analytics system automatically extracts structured business information from multilingual conversations (Hindi, English, Hinglish, regional languages) and stores it for admin dashboard analytics.

## Components

### 1. Extraction Service (`extractionService.ts`)

The core service that extracts structured data from conversations using AI.

**Features:**
- Multilingual support (Hindi, English, Hinglish, regional languages)
- Handles typos, informal language, and code-switching
- Normalizes data to standard English formats
- Confidence scoring
- Scheme interest detection
- Fallback rule-based extraction

**Usage:**

```typescript
import { ExtractionService } from '@/services/analytics';

const extractionService = new ExtractionService();

// Extract from a conversation
const result = await extractionService.extractFromConversation(conversationId);

// Store results
await extractionService.storeExtractionResults(
  conversationId,
  userId,
  result,
  jobId
);
```

**Extraction Result:**

```typescript
{
  attributes: {
    location: "Mumbai",           // Normalized to English
    industry: "Manufacturing - Textiles",
    businessSize: "Micro",
    annualTurnover: 5000000,      // In INR
    employeeCount: 5
  },
  schemeInterests: [
    {
      schemeName: "PMEGP",
      interestLevel: "inquired"
    }
  ],
  metadata: {
    confidence: 0.85,
    detectedLanguages: ["hindi", "english", "hinglish"],
    extractionNotes: "Extracted from conversation about textile business",
    originalLanguageData: {
      location: "मुंबई",
      industry: "kapde ka kaam"
    }
  }
}
```

### 2. Extraction Trigger Service (`extractionTriggerService.ts`)

Determines when to trigger extraction jobs based on conversation activity.

**Trigger Conditions:**
- Every 3 messages (configurable)
- Scheme keywords detected
- Business keywords detected

**Usage:**

```typescript
import { extractionTriggerService } from '@/services/analytics';

// Check if extraction should be triggered
const shouldTrigger = await extractionTriggerService.shouldTriggerExtraction(
  conversationId
);

if (shouldTrigger) {
  // Queue extraction job
  const jobId = await extractionTriggerService.queueExtractionJob(
    conversationId,
    'normal' // priority: 'high' | 'normal' | 'low'
  );
}
```

### 3. Job Queue Processor (`jobQueueProcessor.ts`)

Processes extraction jobs from the queue with retry logic and error handling.

**Features:**
- Priority-based processing (high, normal, low)
- Automatic retry with exponential backoff
- Batch processing
- Queue statistics

**Usage:**

```typescript
import { jobQueueProcessor } from '@/services/analytics';

// Process pending jobs
const result = await jobQueueProcessor.processExtractionQueue(10); // batch size

console.log(result);
// {
//   processed: 10,
//   succeeded: 8,
//   failed: 2,
//   skipped: 0
// }

// Get queue statistics
const stats = await jobQueueProcessor.getQueueStats();
console.log(stats);
// {
//   pending: 15,
//   processing: 2,
//   completed: 100,
//   failed: 5,
//   total: 122
// }
```

## Multilingual Support

### Supported Languages

- Hindi (हिंदी)
- English
- Hinglish (Hindi-English code-switching)
- Regional languages: Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi

### Examples

**Example 1: Hindi**
```
User: "मेरा बिज़नेस मुंबई में है"
→ location: "Mumbai"
```

**Example 2: Hinglish**
```
User: "I have small manufacturing unit in Pune, kapde banate hain"
→ location: "Pune", industry: "Manufacturing - Textiles", businessSize: "Small"
```

**Example 3: Informal**
```
User: "chota sa dukaan hai bangalor me, grocery bechta hu"
→ location: "Bangalore", industry: "Retail - Grocery", businessSize: "Micro"
```

**Example 4: Code-switching with numbers**
```
User: "5 employees hai, turnover 50 lakh ka hai annually"
→ employeeCount: 5, annualTurnover: 5000000, businessSize: "Micro"
```

## Data Normalization

All extracted data is normalized to standard English formats:

### Location Names
- "Dilli", "दिल्ली" → "Delhi"
- "Bangalor", "Bengaluru", "बेंगलुरु" → "Bangalore"
- "Mumbay", "Bombay", "मुंबई" → "Mumbai"

### Industry Categories
- "kapde", "कपड़े", "textile" → "Manufacturing - Textiles"
- "dukaan", "दुकान", "shop" → "Retail"
- "khana", "खाना", "food" → "Manufacturing - Food Processing"

### Currency
- "50 lakh", "50L", "₹50 lakh" → 5000000
- "5 crore", "5 cr", "₹5 crore" → 50000000

### Business Size
- "chota", "छोटा", "small" → "Micro"
- "madhyam", "मध्यम" → "Small"
- "bada", "बड़ा", "large" → "Medium"

## Configuration

Set these environment variables:

```env
# Extraction Service
EXTRACTION_MODEL=openai/gpt-4o-mini
EXTRACTION_CONFIDENCE_THRESHOLD=0.5
EXTRACTION_MESSAGE_THRESHOLD=3
ENABLE_MULTILINGUAL_EXTRACTION=true

# OpenRouter API
OPENROUTER_API_KEY=your_api_key_here
```

## Integration with Chat API

Add extraction trigger to your chat API:

```typescript
import { extractionTriggerService } from '@/services/analytics';

// After saving a message
const shouldTrigger = await extractionTriggerService.shouldTriggerExtraction(
  conversationId
);

if (shouldTrigger) {
  // Queue extraction job (async, doesn't block chat)
  extractionTriggerService.queueExtractionJob(conversationId, 'normal')
    .catch(error => console.error('Failed to queue extraction:', error));
}
```

## Background Processing

Run the job processor as a background service:

```typescript
// scripts/process-extraction-jobs.ts
import { jobQueueProcessor } from '@/services/analytics';

async function processJobs() {
  while (true) {
    try {
      const result = await jobQueueProcessor.processExtractionQueue(10);
      console.log('Processed jobs:', result);
      
      // Wait 10 seconds before next batch
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.error('Job processing error:', error);
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait longer on error
    }
  }
}

processJobs();
```

## Database Schema

### user_attributes
Stores extracted user business attributes:
- location (normalized to English)
- industry (normalized category)
- business_size (Micro/Small/Medium)
- annual_turnover (in INR)
- employee_count
- detected_languages
- original_language_data (JSONB)
- extraction_confidence
- extraction_notes

### scheme_interests
Tracks user interest in schemes:
- scheme_id
- interest_level (mentioned/inquired/detailed)
- mentioned_in_languages
- mention_count
- first_mentioned_at
- last_mentioned_at

### extraction_jobs
Manages extraction job queue:
- status (pending/processing/completed/failed)
- priority (high/normal/low)
- retry_count
- error_message
- message_count_at_extraction

## Error Handling

The extraction service includes comprehensive error handling:

1. **AI Extraction Failure**: Falls back to rule-based extraction
2. **Low Confidence**: Skips storage if confidence < threshold
3. **Retry Logic**: Automatically retries failed jobs with exponential backoff
4. **Duplicate Prevention**: Unique constraint prevents duplicate jobs

## Performance

- **Extraction Time**: < 2 seconds average
- **Throughput**: 100 extractions/minute
- **Queue Processing**: Batch processing with configurable size
- **Caching**: Results cached to avoid re-processing

## Privacy & Compliance

- Only stores business information (no personal identifiers)
- Supports data anonymization
- Configurable data retention policies
- Audit logging for admin access

## Testing

Test the extraction service:

```typescript
import { ExtractionService } from '@/services/analytics';

const service = new ExtractionService();

// Test with a conversation
const result = await service.extractFromConversation('conversation-id');

console.log('Extracted attributes:', result.attributes);
console.log('Confidence:', result.metadata.confidence);
console.log('Languages:', result.metadata.detectedLanguages);
```

## Monitoring

Monitor extraction performance:

```typescript
import { jobQueueProcessor } from '@/services/analytics';

// Get queue statistics
const stats = await jobQueueProcessor.getQueueStats();

// Alert if queue depth is high
if (stats.pending > 100) {
  console.warn('High queue depth:', stats.pending);
}

// Alert if failure rate is high
const failureRate = stats.failed / stats.total;
if (failureRate > 0.15) {
  console.error('High failure rate:', failureRate);
}
```

## Future Enhancements

- Voice input support (speech-to-text + extraction)
- Real-time extraction (WebSocket-based)
- Advanced NLP for better accuracy
- Custom extraction rules
- Sentiment analysis
