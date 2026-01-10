/**
 * Vector Store Service
 * Handles Pinecone operations for the RAG system
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import ragConfig from "./config.js";
import { getEmbeddingModel } from "./embeddings.js";

let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initialize Pinecone client and index
 */
export async function initPinecone() {
  if (!ragConfig.pinecone.apiKey) {
    console.warn("⚠️ PINECONE_API_KEY not set - vector store disabled");
    return null;
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: ragConfig.pinecone.apiKey,
    });
    console.log("✅ Pinecone client initialized");
  }

  if (!pineconeIndex) {
    pineconeIndex = pineconeClient.index(ragConfig.pinecone.indexName);
    console.log(
      `✅ Pinecone index "${ragConfig.pinecone.indexName}" connected`
    );
  }

  return { client: pineconeClient, index: pineconeIndex };
}

/**
 * Get the Pinecone index
 */
export async function getIndex() {
  if (!pineconeIndex) {
    await initPinecone();
  }
  return pineconeIndex;
}

/**
 * Create a LangChain PineconeStore instance
 * @param {string} namespace - Pinecone namespace to use
 */
export async function getVectorStore(namespace = "issues") {
  const index = await getIndex();
  const embeddings = getEmbeddingModel();

  if (!index || !embeddings) {
    throw new Error("Pinecone or embeddings not initialized");
  }

  return PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    namespace,
  });
}

/**
 * Upsert documents to Pinecone
 * @param {Array} documents - Array of { id, textContent, metadata }
 * @param {string} namespace - Target namespace
 */
export async function upsertDocuments(documents, namespace = "issues") {
  const index = await getIndex();
  const embeddings = getEmbeddingModel();

  if (!index || !embeddings) {
    throw new Error("Pinecone or embeddings not initialized");
  }

  // Prepare vectors
  const texts = documents.map((doc) => doc.textContent);
  const vectors = await embeddings.embedDocuments(texts);

  // Format for Pinecone upsert
  const pineconeVectors = documents.map((doc, i) => ({
    id: doc.id,
    values: vectors[i],
    metadata: {
      ...doc.metadata,
      textContent: doc.textContent.substring(0, 1000), // Store truncated text
    },
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < pineconeVectors.length; i += batchSize) {
    const batch = pineconeVectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
  }

  console.log(
    `📤 Upserted ${documents.length} documents to namespace "${namespace}"`
  );
  return documents.length;
}

/**
 * Query similar documents
 * @param {string} query - Query text
 * @param {object} options - Query options
 */
export async function querySimilar(query, options = {}) {
  const {
    namespace = "issues",
    topK = ragConfig.retrieval.topK,
    filter = {},
    minScore = ragConfig.retrieval.minScore,
  } = options;

  const index = await getIndex();
  const embeddings = getEmbeddingModel();

  if (!index || !embeddings) {
    throw new Error("Pinecone or embeddings not initialized");
  }

  // Get query embedding
  const queryVector = await embeddings.embedQuery(query);

  // Query Pinecone
  const results = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    includeMetadata: true,
  });

  // Filter by minimum score and format results
  return results.matches
    .filter((match) => match.score >= minScore)
    .map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
      textContent: match.metadata?.textContent || "",
    }));
}

/**
 * Delete documents by ID
 * @param {string[]} ids - Document IDs to delete
 * @param {string} namespace - Target namespace
 */
export async function deleteDocuments(ids, namespace = "issues") {
  const index = await getIndex();

  if (!index) {
    throw new Error("Pinecone not initialized");
  }

  await index.namespace(namespace).deleteMany(ids);
  console.log(
    `🗑️ Deleted ${ids.length} documents from namespace "${namespace}"`
  );
}

/**
 * Delete all documents in a namespace
 * @param {string} namespace - Target namespace
 */
export async function deleteNamespace(namespace) {
  const index = await getIndex();

  if (!index) {
    throw new Error("Pinecone not initialized");
  }

  await index.namespace(namespace).deleteAll();
  console.log(`🗑️ Deleted all documents from namespace "${namespace}"`);
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
  const index = await getIndex();

  if (!index) {
    return null;
  }

  const stats = await index.describeIndexStats();
  return {
    totalVectors: stats.totalRecordCount,
    namespaces: stats.namespaces,
    dimension: stats.dimension,
  };
}

export default {
  initPinecone,
  getIndex,
  getVectorStore,
  upsertDocuments,
  querySimilar,
  deleteDocuments,
  deleteNamespace,
  getIndexStats,
};
