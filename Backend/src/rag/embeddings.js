/**
 * Embedding Service
 * Handles text embedding using OpenAI
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import ragConfig from "./config.js";

let embeddingModel = null;

/**
 * Initialize the embedding model
 */
export function initEmbeddings() {
  if (!ragConfig.llm.openaiApiKey) {
    console.warn("⚠️ OPENAI_API_KEY not set - embeddings disabled");
    return null;
  }

  if (!embeddingModel) {
    embeddingModel = new OpenAIEmbeddings({
      openAIApiKey: ragConfig.llm.openaiApiKey,
      modelName: ragConfig.embedding.model,
    });
    console.log("✅ OpenAI embedding model initialized");
  }

  return embeddingModel;
}

/**
 * Get embeddings for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
export async function embedText(text) {
  const model = initEmbeddings();
  if (!model) {
    throw new Error("Embedding model not initialized");
  }

  const embedding = await model.embedQuery(text);
  return embedding;
}

/**
 * Get embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function embedTexts(texts) {
  const model = initEmbeddings();
  if (!model) {
    throw new Error("Embedding model not initialized");
  }

  // Process in batches
  const batchSize = ragConfig.embedding.batchSize;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await model.embedDocuments(batch);
    allEmbeddings.push(...embeddings);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allEmbeddings;
}

/**
 * Get the embedding model instance
 */
export function getEmbeddingModel() {
  return initEmbeddings();
}

export default {
  initEmbeddings,
  embedText,
  embedTexts,
  getEmbeddingModel,
};
