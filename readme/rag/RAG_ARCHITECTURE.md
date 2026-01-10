# CitizenVoice RAG System — Citizen Transparency Layer

> **Architecture Document v1.0**  
> Designed for production deployment with zero breaking changes

---

## 1. Executive Verdict

### ✅ RAG IS USEFUL for Citizens Here

**YES**, RAG adds genuine value for citizen transparency in CitizenVoice:

| Use Case                             | Value      | Justification                                                   |
| ------------------------------------ | ---------- | --------------------------------------------------------------- |
| "Why is my issue pending?"           | **HIGH**   | Synthesizes status history, department workload, similar delays |
| "Is this delay normal?"              | **HIGH**   | Compares against ward/category historical averages              |
| "What happened with similar issues?" | **MEDIUM** | Retrieves pattern matches from resolved issues                  |
| "How does this department perform?"  | **MEDIUM** | Aggregates metrics into human-readable summaries                |
| "Which department handles this?"     | **LOW**    | Deterministic routing already exists—RAG adds explanation only  |

### ❌ Where RAG Should NEVER Be Used

| Anti-Pattern        | Why                                                  |
| ------------------- | ---------------------------------------------------- |
| Routing decisions   | Existing CNN + rules are deterministic and auditable |
| Priority assignment | Must remain rule-based for accountability            |
| Status changes      | Only officials can change status                     |
| Verification voting | Community verification is explicit, not AI-inferred  |
| Official actions    | All official actions must be logged, not generated   |

**RAG is READ-ONLY and EXPLANATORY. It never makes decisions.**

---

## 2. Citizen-Focused RAG Use Cases

### Primary Query Templates

```
1. STATUS EXPLANATION
   "Why is issue ISS-1234 still pending?"
   → Retrieves: issue history, department queue, similar delays

2. DELAY CONTEXT
   "Is 5 days normal for pothole issues in Andheri?"
   → Retrieves: ward+category statistics, historical averages

3. HISTORICAL PATTERNS
   "Have there been similar garbage issues near Lokhandwala?"
   → Retrieves: location-proximate issues, resolution patterns

4. DEPARTMENT PERFORMANCE
   "How fast does the Roads Department resolve potholes?"
   → Retrieves: aggregated resolution metrics, trend data

5. PROCESS TRANSPARENCY
   "What happens after an issue is acknowledged?"
   → Retrieves: process documentation, typical timelines
```

### Query Classification (Pre-RAG Filter)

```
ALLOWED QUERIES (proceed to RAG):
- Status explanation requests
- Historical comparison requests
- Department performance questions
- Process clarification requests
- Timeline estimation requests

BLOCKED QUERIES (reject with static response):
- "Change my issue status"
- "Assign this to department X"
- "Delete my issue"
- "Increase priority"
- Any action request
```

---

## 3. RAG Data Design (Critical)

### 3.1 Document Types for Embedding

| Document Type         | Source                   | Update Frequency   |
| --------------------- | ------------------------ | ------------------ |
| Issue Snapshots       | `Issue` collection       | On status change   |
| Resolution Reports    | `Report` collection      | On report approval |
| Department Metrics    | Aggregated from Issues   | Daily (batch)      |
| Ward Statistics       | Aggregated by districtId | Daily (batch)      |
| Process Documentation | Static content           | Manual updates     |

### 3.2 Document Schema for Embedding

#### Issue Document (per issue)

```javascript
{
  // TEXT CONTENT (embedded)
  textContent: `
    Issue ${issueId}: ${title}
    Category: ${category}
    Priority: ${priority}
    Status: ${status}
    Location: ${location.address}, ${location.district}, ${location.state}
    Reported: ${createdAt}
    Last Updated: ${updatedAt}
    Description: ${description}
    ${resolutionSummary ? `Resolution: ${resolutionSummary}` : ''}
    ${rootCause ? `Root Cause: ${rootCause}` : ''}
    Days Open: ${daysOpen}
    Verification Status: ${verifiedCount} verifications, ${incorrectCount} flags
  `,

  // METADATA (for filtering, NOT embedded)
  metadata: {
    issueId: "ISS-1234567890",
    districtId: "maharashtra__mumbai",
    ward: "andheri-west",
    category: "pothole",
    department: "roads",
    status: "resolved",
    priority: "high",
    reportedDate: "2026-01-05",
    resolvedDate: "2026-01-08",
    daysToResolve: 3,
    docType: "issue"
  }
}
```

#### Department Metrics Document (per department per district)

```javascript
{
  textContent: `
    Department: Roads Department
    District: Mumbai, Maharashtra
    Period: Last 30 days

    Performance Summary:
    - Total Issues: 145
    - Resolved: 128 (88.3%)
    - Average Resolution Time: 4.2 days
    - Fastest Resolution: 1 day
    - Slowest Resolution: 14 days

    By Category:
    - Potholes: 89 issues, avg 3.8 days
    - Road damage: 34 issues, avg 5.1 days
    - Signage: 22 issues, avg 2.1 days

    Trend: Resolution time improved 12% from previous month.
  `,

  metadata: {
    districtId: "maharashtra__mumbai",
    department: "roads",
    periodStart: "2025-12-10",
    periodEnd: "2026-01-10",
    docType: "department_metrics"
  }
}
```

#### Ward Statistics Document (per ward/district)

```javascript
{
  textContent: `
    Ward: Andheri West, Mumbai, Maharashtra
    Period: Last 30 days

    Issue Distribution:
    - Potholes: 45 (32%)
    - Garbage: 38 (27%)
    - Streetlights: 28 (20%)
    - Water: 18 (13%)
    - Other: 11 (8%)

    Resolution Rates:
    - Overall: 82%
    - Potholes: 91%
    - Garbage: 76%
    - Streetlights: 89%

    Average Wait Times:
    - Potholes: 3.2 days
    - Garbage: 5.8 days
    - Streetlights: 2.1 days

    Community Activity:
    - Active verifiers: 23
    - Verification rate: 78%
  `,

  metadata: {
    districtId: "maharashtra__mumbai",
    ward: "andheri-west",
    periodStart: "2025-12-10",
    periodEnd: "2026-01-10",
    docType: "ward_stats"
  }
}
```

### 3.3 Chunking Strategy

```
STRATEGY: Document-level embedding (NO chunking)

RATIONALE:
- Issue documents: avg 300-500 tokens (well within limits)
- Metrics documents: avg 400-600 tokens
- No semantic breakage from mid-document splits
- Simpler retrieval logic
- Better context preservation

EXCEPTION:
- Process documentation > 2000 tokens: chunk at 1500 tokens with 200 overlap
```

### 3.4 Embedding Model

```
MODEL: text-embedding-004 (Gemini)
DIMENSIONS: 768
COST: Free tier (1500 requests/minute)

ALTERNATIVE: text-embedding-ada-002 (OpenAI)
DIMENSIONS: 1536
COST: Free $5 credit, then $0.0001/1K tokens
```

---

## 4. LangChain + Pinecone Architecture

### 4.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CITIZEN DASHBOARD                              │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │   "Why is my issue still pending?"  [Ask AI ✨]                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RAG API LAYER (Express)                         │
│  POST /api/rag/explain                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Rate Limiter │──│ Auth Check   │──│ Query Filter │               │
│  │ (10 req/min) │  │ (JWT valid)  │  │ (Allowed?)   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LANGCHAIN ORCHESTRATION                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    RetrievalQAChain                            │ │
│  │                                                                │ │
│  │  1. QUERY ANALYSIS                                             │ │
│  │     └─ Extract: category, district, issueId, intent           │ │
│  │                                                                │ │
│  │  2. VECTOR RETRIEVAL (Pinecone)                               │ │
│  │     └─ Query with metadata filters                            │ │
│  │     └─ Retrieve top-k (k=5) relevant documents                │ │
│  │                                                                │ │
│  │  3. CONTEXT ASSEMBLY                                          │ │
│  │     └─ Combine retrieved docs into context window             │ │
│  │     └─ Add user's issue data (if issueId provided)            │ │
│  │                                                                │ │
│  │  4. LLM GENERATION (Gemini)                                   │ │
│  │     └─ System prompt + context + user query                   │ │
│  │     └─ Strict retrieval-only response                         │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE + TRANSPARENCY                           │
│  {                                                                   │
│    "answer": "Your pothole issue has been pending for 4 days...",   │
│    "confidence": "high",                                             │
│    "sources": [                                                      │
│      { "type": "issue", "id": "ISS-123", "relevance": 0.92 },       │
│      { "type": "ward_stats", "district": "mumbai", ... }            │
│    ],                                                                │
│    "disclaimer": "This is an AI-generated explanation..."           │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘


                        BACKGROUND INDEXING PIPELINE
                        ════════════════════════════

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   Indexer       │    │   Pinecone      │
│   (Source)      │───▶│   Service       │───▶│   (Vector DB)   │
│                 │    │                 │    │                 │
│ • Issues        │    │ • Transform     │    │ • Namespace:    │
│ • Reports       │    │ • Embed         │    │   issues        │
│ • Users         │    │ • Upsert        │    │   metrics       │
└─────────────────┘    └─────────────────┘    │   ward_stats    │
                             │                └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Triggers:      │
                    │  • Issue status │
                    │    change       │
                    │  • Daily cron   │
                    │    (metrics)    │
                    └─────────────────┘
```

### 4.2 Pinecone Index Design

```
INDEX NAME: citizenvoice-rag
DIMENSION: 768 (Gemini embedding)
METRIC: cosine
POD TYPE: starter (free tier)

NAMESPACE STRATEGY:
├── issues          # Individual issue documents
├── metrics         # Department performance aggregates
├── ward_stats      # Ward-level statistics
└── process_docs    # Static process documentation

METADATA SCHEMA:
{
  docType:      string  // "issue" | "metrics" | "ward_stats" | "process"
  districtId:   string  // "maharashtra__mumbai"
  category:     string  // "pothole" | "garbage" | etc.
  department:   string  // "roads" | "sanitation" | etc.
  status:       string  // "reported" | "resolved" | etc.
  priority:     string  // "low" | "medium" | "high"
  dateRange:    string  // "2026-01" for time filtering
  issueId:      string  // For issue docs only
}

CAPACITY (Free Tier):
- Vectors: 100,000
- Dimensions: Up to 1536
- Namespaces: Unlimited
- Queries: 100 writes/sec, 100 reads/sec
```

### 4.3 LangChain Components

```javascript
// Components Used:

1. GoogleGenerativeAIEmbeddings
   - Model: text-embedding-004
   - Batch size: 100

2. PineconeVectorStore
   - Native LangChain integration
   - Metadata filtering support

3. ChatGoogleGenerativeAI
   - Model: gemini-1.5-flash (free tier)
   - Temperature: 0.1 (low creativity)
   - Max tokens: 500

4. RetrievalQAChain
   - Type: stuff (combine all docs)
   - Return sources: true

5. PromptTemplate
   - Custom citizen-focused template
   - Strict retrieval-only instructions
```

---

## 5. Step-by-Step Implementation Plan

### Phase 1: Core Infrastructure (Day 1-2)

#### 5.1 Install Dependencies

```bash
cd Backend
npm install langchain @langchain/google-genai @langchain/pinecone @pinecone-database/pinecone
```

#### 5.2 Create RAG Service Directory Structure

```
Backend/src/
├── rag/
│   ├── index.js              # Main RAG orchestrator
│   ├── config.js             # Configuration & env validation
│   ├── embeddings.js         # Embedding service
│   ├── vectorStore.js        # Pinecone operations
│   ├── documentBuilder.js    # MongoDB → RAG document transformer
│   ├── queryProcessor.js     # Query analysis & filtering
│   ├── prompts.js            # LLM prompt templates
│   └── indexer.js            # Background indexing pipeline
├── routes/
│   └── ragRoutes.js          # API endpoints
├── controllers/
│   └── ragController.js      # Request handlers
└── middleware/
    └── ragMiddleware.js      # Rate limiting, auth
```

### Phase 2: Document Transformation (Day 2-3)

#### 5.3 Document Builder Implementation

See [Backend/src/rag/documentBuilder.js] for full implementation.

Key transformations:

- Issue → RAG Document with full context
- Reports → Enriched resolution summaries
- Aggregated metrics → Department/ward documents

### Phase 3: Vector Store Setup (Day 3-4)

#### 5.4 Pinecone Initialization

```javascript
// One-time setup (run manually)
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Create index (if not exists)
await pinecone.createIndex({
  name: "citizenvoice-rag",
  dimension: 768,
  metric: "cosine",
  spec: {
    serverless: {
      cloud: "aws",
      region: "us-east-1",
    },
  },
});
```

### Phase 4: Indexing Pipeline (Day 4-5)

#### 5.5 Real-time Indexing (on issue status change)

```javascript
// In issueController.js - updateIssueStatus
import { ragIndexer } from "../rag/indexer.js";

// After status update succeeds:
if (process.env.RAG_ENABLED === "true") {
  ragIndexer.indexIssue(issue).catch((err) => {
    console.error("RAG indexing failed (non-blocking):", err);
  });
}
```

#### 5.6 Batch Indexing (daily metrics)

```javascript
// cron job or manual trigger
import { ragIndexer } from "../rag/indexer.js";

// Run daily at 2 AM
await ragIndexer.rebuildMetrics();
await ragIndexer.rebuildWardStats();
```

### Phase 5: Query API (Day 5-6)

#### 5.7 RAG Endpoint

```
POST /api/rag/explain

Request:
{
  "query": "Why is my issue still pending?",
  "issueId": "ISS-1234567890",        // optional
  "districtId": "maharashtra__mumbai"  // optional
}

Response:
{
  "success": true,
  "data": {
    "answer": "Your pothole issue (ISS-1234567890) has been...",
    "confidence": "high",
    "sources": [...],
    "disclaimer": "This explanation is AI-generated..."
  }
}
```

### Phase 6: Frontend Integration (Day 6-7)

Add "Ask AI" button to issue detail views.
See UI Integration section below.

---

## 6. LLM Prompt Templates (Mandatory)

### 6.1 System Prompt

```javascript
const SYSTEM_PROMPT = `You are a transparency assistant for CitizenVoice, a civic issue tracking platform.

CRITICAL RULES - FOLLOW EXACTLY:

1. ONLY use information from the RETRIEVED CONTEXT below
2. If the context doesn't contain enough information, say: "I don't have enough data to answer this specifically. Based on general patterns..."
3. NEVER make up statistics, dates, or department names
4. NEVER suggest actions the user should take
5. NEVER claim to know real-time status - always use past tense or "based on available data"
6. Use simple, citizen-friendly language
7. Always mention specific departments and timeframes when available
8. If asked to take action (change status, assign, delete), respond: "I can only provide explanations. Please use the dashboard to take actions."

RESPONSE FORMAT:
- Keep answers under 200 words
- Use bullet points for multiple items
- End with the disclaimer: "This is based on historical data and may not reflect real-time status."

RETRIEVED CONTEXT:
{context}

USER QUESTION: {question}

Provide a clear, factual explanation based ONLY on the context above:`;
```

### 6.2 Query Classification Prompt

```javascript
const QUERY_CLASSIFIER_PROMPT = `Classify this user query into one of these categories:

ALLOWED (proceed with RAG):
- status_explanation: Asking why an issue has a certain status
- delay_context: Asking if a delay is normal
- historical_pattern: Asking about similar past issues
- department_performance: Asking about department metrics
- process_clarification: Asking how the system works

BLOCKED (reject immediately):
- action_request: Asking to change/delete/assign something
- personal_data: Asking for other users' information
- off_topic: Not related to civic issues

Query: "{query}"

Respond with ONLY the category name, nothing else.`;
```

### 6.3 Insufficient Data Response Template

```javascript
const INSUFFICIENT_DATA_RESPONSE = `I don't have specific data about this in my records.

Here's what I can tell you based on general patterns:
- {category} issues in {district} typically take {avg_days} days to resolve
- The responsible department is usually {department}
- Current overall resolution rate is {resolution_rate}%

For real-time status, please check your issue details on the dashboard.

This is based on historical data and may not reflect real-time status.`;
```

---

## 7. Environment Variables (Mandatory)

### Required Variables

Add these to `Backend/.env`:

```dotenv
# ============================================
# RAG CONFIGURATION
# ============================================

# Master switch - set to 'false' to completely disable RAG
RAG_ENABLED=true

# Pinecone Vector Database (Free Starter Tier)
# Get from: https://app.pinecone.io/
PINECONE_API_KEY=pcsk_xxxxx
PINECONE_INDEX_NAME=citizenvoice-rag
PINECONE_ENVIRONMENT=us-east-1

# Google Gemini (Free Tier - 1500 req/min)
# Get from: https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX

# Optional: OpenAI as fallback (if Gemini quota exceeded)
# OPENAI_API_KEY=sk-xxxx

# RAG Behavior Settings
RAG_MAX_TOKENS=500
RAG_TEMPERATURE=0.1
RAG_TOP_K_RESULTS=5

# Rate Limiting
RAG_RATE_LIMIT_WINDOW_MS=60000
RAG_RATE_LIMIT_MAX_REQUESTS=10

# Cache TTL (seconds)
RAG_CACHE_TTL=300
```

### Variable Usage Map

| Variable              | Used In                     | Purpose                     |
| --------------------- | --------------------------- | --------------------------- |
| `RAG_ENABLED`         | All RAG files               | Master on/off switch        |
| `PINECONE_API_KEY`    | `vectorStore.js`            | Authenticate with Pinecone  |
| `PINECONE_INDEX_NAME` | `vectorStore.js`            | Target index name           |
| `GEMINI_API_KEY`      | `embeddings.js`, `index.js` | Embeddings + LLM calls      |
| `RAG_MAX_TOKENS`      | `index.js`                  | Limit response length       |
| `RAG_TEMPERATURE`     | `index.js`                  | Control response creativity |
| `RAG_TOP_K_RESULTS`   | `queryProcessor.js`         | Documents to retrieve       |

### Graceful Degradation

```javascript
// In rag/config.js
export const ragConfig = {
  enabled: process.env.RAG_ENABLED === "true",

  // If any required var is missing, disable RAG
  isConfigured() {
    const required = ["PINECONE_API_KEY", "GEMINI_API_KEY"];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.warn(`RAG disabled: missing ${missing.join(", ")}`);
      return false;
    }
    return this.enabled;
  },
};
```

---

## 8. UI Integration (Non-Disruptive)

### 8.1 Where RAG Appears

```
CITIZEN DASHBOARD ONLY:

1. Issue Detail Page
   └─ [Ask AI: "Why is this pending?"] button
   └─ Appears below issue status
   └─ Opens modal with explanation

2. Issue List (Optional)
   └─ Small "?" icon next to delayed issues
   └─ Tooltip: "Ask AI about this delay"

3. Department Performance Section
   └─ [Explain Performance] button
   └─ Summarizes metrics in plain language
```

### 8.2 UI Components

```jsx
// CitizenVoice/src/components/RAG/AskAIButton.jsx
function AskAIButton({ issueId, districtId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const askAI = async (query) => {
    setLoading(true);
    try {
      const response = await ragService.explain({
        query,
        issueId,
        districtId,
      });
      setAnswer(response.data);
    } catch (err) {
      setAnswer({
        error: true,
        answer: "AI explanation unavailable. Please try later.",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-rose-400 hover:text-rose-300 text-sm flex items-center gap-1"
      >
        <Sparkles className="w-4 h-4" />
        Ask AI
      </button>

      {isOpen && (
        <AIExplanationModal
          onClose={() => setIsOpen(false)}
          onAsk={askAI}
          answer={answer}
          loading={loading}
        />
      )}
    </>
  );
}
```

### 8.3 What NEVER Gets Replaced

```
NEVER replace with RAG output:
- Official issue status (comes from DB)
- Dates and timestamps (comes from DB)
- Department assignments (comes from DB)
- Action buttons (Report, Verify, etc.)
- User information
- Images and evidence

RAG is SUPPLEMENTARY, not a replacement for real data.
```

### 8.4 Transparency Requirements

```jsx
// Always show:
1. "AI-Generated" badge on all RAG responses
2. Source indicators: "Based on X similar issues and department metrics"
3. Disclaimer: "This is an AI explanation, not official status"
4. Timestamp: "Analysis based on data as of {date}"
```

---

## 9. Risks & Mitigations

### 9.1 Hallucination Risk

| Risk                        | Mitigation                                  |
| --------------------------- | ------------------------------------------- |
| LLM invents statistics      | Strict prompt: "ONLY use retrieved context" |
| Fabricated department names | Validate against known department list      |
| Wrong dates/timelines       | Cross-check with source documents           |
| Overconfident answers       | Always include uncertainty disclaimer       |

**Implementation:**

```javascript
// Post-processing validation
function validateResponse(response, context) {
  // Check if any numbers in response exist in context
  const numbers = response.match(/\d+/g) || [];
  const contextText = context.map((d) => d.textContent).join(" ");

  for (const num of numbers) {
    if (!contextText.includes(num)) {
      return {
        ...response,
        confidence: "low",
        warning: "Some statistics could not be verified",
      };
    }
  }
  return response;
}
```

### 9.2 Legal/Accountability Risk

| Risk                                 | Mitigation                          |
| ------------------------------------ | ----------------------------------- |
| Citizens rely on AI for legal action | Clear disclaimers on every response |
| AI blamed for wrong information      | Audit log every query + response    |
| Privacy violations                   | Never expose other users' data      |

**Audit Logging:**

```javascript
// Log every RAG interaction
const ragAuditSchema = new mongoose.Schema({
  userId: ObjectId,
  query: String,
  issueId: String,
  response: String,
  sources: [String],
  confidence: String,
  timestamp: Date,
  processingTimeMs: Number,
});
```

### 9.3 Bias Risk

| Risk                                     | Mitigation                                |
| ---------------------------------------- | ----------------------------------------- |
| Underreported wards have less data       | Explicitly state "limited data available" |
| Historical bias in resolution times      | Note that metrics are historical averages |
| Category misclassification affects stats | Use verified issues only for stats        |

### 9.4 Pinecone Free Tier Limits

| Limit      | Value     | Mitigation                         |
| ---------- | --------- | ---------------------------------- |
| Vectors    | 100,000   | Prune resolved issues > 6 months   |
| Writes     | 100/sec   | Batch upserts, queue during spikes |
| Reads      | 100/sec   | Client-side caching (5 min TTL)    |
| Namespaces | Unlimited | Use for logical separation         |

**Pruning Strategy:**

```javascript
// Monthly cleanup job
async function pruneOldVectors() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Delete resolved issues older than 6 months
  await pineconeIndex.namespace("issues").deleteMany({
    filter: {
      status: "resolved",
      resolvedDate: { $lt: sixMonthsAgo.toISOString() },
    },
  });
}
```

### 9.5 Latency & Cost Control

| Concern            | Solution                          |
| ------------------ | --------------------------------- |
| Cold start latency | Keep-alive pings every 5 min      |
| LLM response time  | Set timeout at 10 seconds         |
| API costs          | Cache identical queries for 5 min |
| Runaway costs      | Hard rate limit: 10 req/user/min  |

**Caching Layer:**

```javascript
// Simple in-memory cache
const queryCache = new Map();

function getCachedResponse(queryHash) {
  const cached = queryCache.get(queryHash);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.response;
  }
  return null;
}
```

### 9.6 User Trust

| Concern              | Solution                              |
| -------------------- | ------------------------------------- |
| Users don't trust AI | Show sources explicitly               |
| Inconsistent answers | Low temperature (0.1) for consistency |
| Stale information    | Show "Data as of" timestamp           |
| AI feels impersonal  | Friendly, empathetic tone in prompts  |

---

## 10. Failure & Fallback Handling

### 10.1 Graceful Degradation Hierarchy

```
1. RAG_ENABLED=false
   └─ RAG endpoints return: "AI explanations are currently disabled"
   └─ All other functionality works normally

2. Pinecone unavailable
   └─ Return cached response if available
   └─ Otherwise: "Unable to search historical data. Please try later."

3. Gemini quota exceeded
   └─ Attempt OpenAI fallback (if configured)
   └─ Otherwise: Return retrieved documents without LLM summary

4. No relevant documents found
   └─ Return generic response based on category/department defaults

5. Query timeout (>10s)
   └─ Return partial response if available
   └─ Otherwise: "Request timed out. Please try a simpler question."
```

### 10.2 Error Response Format

```javascript
// Consistent error responses
{
  "success": false,
  "error": {
    "code": "RAG_UNAVAILABLE",
    "message": "AI explanations are temporarily unavailable",
    "fallback": "Your issue ISS-1234 is currently in 'pending' status. For detailed information, please check the issue timeline.",
    "retryAfter": 60
  }
}
```

---

## 11. Complete File Structure

After implementation:

```
Backend/src/
├── rag/
│   ├── index.js              # 150 lines - Main orchestrator
│   ├── config.js             # 50 lines - Configuration
│   ├── embeddings.js         # 80 lines - Gemini embeddings
│   ├── vectorStore.js        # 120 lines - Pinecone operations
│   ├── documentBuilder.js    # 200 lines - Document transformers
│   ├── queryProcessor.js     # 100 lines - Query analysis
│   ├── prompts.js            # 80 lines - Prompt templates
│   ├── indexer.js            # 180 lines - Background indexing
│   └── cache.js              # 60 lines - Query cache
├── routes/
│   └── ragRoutes.js          # 30 lines - API routes
├── controllers/
│   └── ragController.js      # 100 lines - Request handlers
├── models/
│   └── RagAuditLog.js        # 40 lines - Audit schema
└── middleware/
    └── ragRateLimit.js       # 40 lines - Rate limiting
```

---

## 12. Final Recommendations

### DO:

- ✅ Start with issue explanations only (highest value)
- ✅ Cache aggressively (5 min TTL minimum)
- ✅ Log everything for debugging and auditing
- ✅ Show sources with every response
- ✅ Test with real ward/department data

### DON'T:

- ❌ Don't enable RAG for officials (different trust model)
- ❌ Don't expose raw vector scores to users
- ❌ Don't index unverified issues (garbage in, garbage out)
- ❌ Don't promise real-time accuracy

### SIMPLIFICATION OPPORTUNITIES:

1. **Skip department metrics initially** - Issue explanations alone provide 80% of value
2. **Skip ward statistics initially** - Add after validating issue queries work
3. **Use single namespace** - Multi-namespace adds complexity without proportional benefit at this scale
4. **Skip OpenAI fallback** - Gemini free tier is generous; add fallback only if needed

---

## Next Steps

1. **Create the RAG directory and files** (I'll generate these next)
2. **Initialize Pinecone index** (one-time setup)
3. **Run initial indexing** of existing resolved issues
4. **Add RAG route to Express app**
5. **Build frontend components**
6. **Test with real queries**

Ready to proceed with implementation code?
