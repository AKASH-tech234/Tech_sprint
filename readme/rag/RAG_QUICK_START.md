# CitizenVoice RAG System — Quick Start Guide

## Prerequisites

- Node.js 18+
- Pinecone account (free tier): https://app.pinecone.io/
- Google AI Studio account: https://aistudio.google.com/

## Step 1: Environment Variables

Your `.env` file should already have:

```dotenv
# Pinecone (you already have this)
PINECONE_API_KEY=pcsk_xxxxx

# Gemini (you already have this)
GEMINI_API_KEY=AIzaSyXXXXXX

# RAG Configuration (add these)
RAG_ENABLED=true
PINECONE_INDEX_NAME=citizenvoice-rag
PINECONE_ENVIRONMENT=us-east-1
RAG_MAX_TOKENS=500
RAG_TEMPERATURE=0.1
RAG_TOP_K_RESULTS=5
RAG_RATE_LIMIT_WINDOW_MS=60000
RAG_RATE_LIMIT_MAX_REQUESTS=10
RAG_CACHE_TTL=300
```

## Step 2: Create Pinecone Index

### Option A: Using Script

```bash
cd Backend
node src/scripts/setupPinecone.js
```

### Option B: Manual (Pinecone Console)

1. Go to https://app.pinecone.io/
2. Create new index:
   - Name: `citizenvoice-rag`
   - Dimensions: `768`
   - Metric: `cosine`
   - Pod type: Starter (free)

## Step 3: Start Backend

```bash
cd Backend
npm run dev
```

You should see:

```
✅ MONGO Connected
✅ RAG system ready
✅ Server running on port 3000
```

## Step 4: Initial Indexing

After the server starts, index your existing issues:

```bash
# Using curl
curl -X POST http://localhost:3000/api/rag/reindex \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_ADMIN_JWT_TOKEN" \
  -d '{"target": "all"}'
```

Or use Postman/Insomnia to POST to `/api/rag/reindex`.

## Step 5: Test RAG

```bash
# Test query (no auth required)
curl -X POST http://localhost:3000/api/rag/explain \
  -H "Content-Type: application/json" \
  -d '{"query": "How long do pothole issues typically take to resolve?"}'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "answer": "Based on the available data, pothole issues typically take 3-5 days to resolve...",
    "confidence": "medium",
    "sources": [...],
    "disclaimer": "This is an AI-generated explanation..."
  }
}
```

## Step 6: Frontend Integration

The `AskAIButton` component is ready to use:

```jsx
import { AskAIButton } from "../components/RAG";

// In your issue detail component:
<AskAIButton
  issueId={issue.issueId}
  districtId={issue.districtId}
  category={issue.category}
  status={issue.status}
/>;
```

## API Endpoints

| Endpoint               | Method | Auth     | Description                  |
| ---------------------- | ------ | -------- | ---------------------------- |
| `/api/rag/explain`     | POST   | Optional | Main query endpoint          |
| `/api/rag/status`      | GET    | None     | Check RAG status             |
| `/api/rag/reindex`     | POST   | Admin    | Trigger reindexing           |
| `/api/rag/clear-cache` | POST   | Admin    | Clear response cache         |
| `/api/rag/prune`       | POST   | Admin    | Remove old issues from index |

## Disable RAG

To completely disable RAG without code changes:

```dotenv
RAG_ENABLED=false
```

The system will continue to work normally; RAG endpoints will return appropriate disabled messages.

## Troubleshooting

### "RAG not configured"

- Check that `PINECONE_API_KEY` and `GEMINI_API_KEY` are set in `.env`
- Ensure `RAG_ENABLED=true`

### "No relevant documents found"

- Run reindexing: `POST /api/rag/reindex {"target": "issues"}`
- Check Pinecone dashboard for vector count

### Rate limiting

- Default: 10 requests per minute per user
- Adjust with `RAG_RATE_LIMIT_MAX_REQUESTS`

### Slow responses

- First query may be slower (cold start)
- Subsequent queries use cache (5 min TTL)

## File Structure

```
Backend/src/rag/
├── config.js          # Configuration & env validation
├── cache.js           # Response caching
├── documentBuilder.js # MongoDB → RAG document transform
├── embeddings.js      # Gemini embeddings
├── index.js           # Main orchestrator
├── indexer.js         # Background indexing
├── prompts.js         # LLM prompt templates
├── queryProcessor.js  # Query classification
└── vectorStore.js     # Pinecone operations

Backend/src/
├── controllers/ragController.js
├── routes/ragRoutes.js
├── middleware/ragRateLimit.js
└── models/RagAuditLog.js

CitizenVoice/src/
├── services/ragService.js
└── components/RAG/
    ├── AskAIButton.jsx
    └── index.js
```

## Daily Maintenance (Optional)

Set up a cron job to rebuild metrics daily:

```bash
# Crontab entry (runs at 2 AM)
0 2 * * * curl -X POST http://localhost:3000/api/rag/reindex \
  -H "Cookie: token=ADMIN_TOKEN" \
  -d '{"target": "metrics"}'
```

## Cost Monitoring

### Pinecone Free Tier Limits

- 100,000 vectors
- 100 writes/sec
- 100 reads/sec

### Gemini Free Tier Limits

- 1,500 requests/minute
- 1 million tokens/month

Monitor usage at:

- https://app.pinecone.io/ (Pinecone)
- https://aistudio.google.com/ (Gemini)
