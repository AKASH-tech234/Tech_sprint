/**
 * Pinecone Index Setup Script
 * Run this once to create the Pinecone index for RAG
 *
 * Usage: node src/scripts/setupPinecone.js
 */

import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from Backend root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "citizenvoice-rag";

async function setupPinecone() {
  console.log("🔧 Pinecone Index Setup Script");
  console.log("================================\n");

  if (!PINECONE_API_KEY) {
    console.error("❌ PINECONE_API_KEY not found in .env");
    process.exit(1);
  }

  console.log(`📌 Index name: ${INDEX_NAME}`);
  console.log("📐 Dimensions: 1536 (OpenAI text-embedding-3-small)");
  console.log("📏 Metric: cosine\n");

  try {
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    // List existing indexes
    console.log("📋 Checking existing indexes...");
    const existingIndexes = await pinecone.listIndexes();
    console.log(
      "   Found:",
      existingIndexes.indexes?.map((i) => i.name).join(", ") || "none"
    );

    // Check if our index exists
    const indexExists = existingIndexes.indexes?.some(
      (i) => i.name === INDEX_NAME
    );

    if (indexExists) {
      console.log(`\n✅ Index "${INDEX_NAME}" already exists!`);

      // Get index stats
      const index = pinecone.index(INDEX_NAME);
      const stats = await index.describeIndexStats();

      console.log("\n📊 Current Index Stats:");
      console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
      console.log(`   Dimension: ${stats.dimension}`);
      console.log("   Namespaces:");

      if (stats.namespaces) {
        for (const [ns, data] of Object.entries(stats.namespaces)) {
          console.log(`     - ${ns}: ${data.recordCount} vectors`);
        }
      } else {
        console.log("     - No vectors yet");
      }
    } else {
      console.log(`\n🔨 Creating index "${INDEX_NAME}"...`);

      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: 1536,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      console.log("⏳ Waiting for index to be ready...");

      // Wait for index to be ready
      let ready = false;
      let attempts = 0;

      while (!ready && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const indexes = await pinecone.listIndexes();
        const index = indexes.indexes?.find((i) => i.name === INDEX_NAME);

        if (index?.status?.ready) {
          ready = true;
        }
        attempts++;
        process.stdout.write(".");
      }

      console.log("\n");

      if (ready) {
        console.log(`✅ Index "${INDEX_NAME}" created and ready!`);
      } else {
        console.log(
          `⚠️ Index created but may take a few more minutes to be ready.`
        );
      }
    }

    console.log("\n================================");
    console.log("🎉 Setup complete!");
    console.log("\nNext steps:");
    console.log("1. Start the backend: npm run dev");
    console.log(
      '2. Index existing issues: POST /api/rag/reindex { "target": "all" }'
    );
    console.log(
      '3. Test: POST /api/rag/explain { "query": "How long do pothole issues take?" }'
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);

    if (error.message?.includes("FORBIDDEN")) {
      console.error(
        "\n💡 Your API key may not have permission to create indexes."
      );
      console.error(
        "   If using free tier, you may need to create the index manually at:"
      );
      console.error("   https://app.pinecone.io/");
    }

    process.exit(1);
  }
}

setupPinecone();
