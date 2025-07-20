import { readFile } from "fs/promises";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { performance } from "perf_hooks";

dotenv.config();

// === CONFIG ===
const JSON_FILE_PATH = "./data/cleaned_projects.json";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = "hackathon-projects";
const NAMESPACE = "projects";
const EMBED_MODEL = "llama-text-embed-v2";
const BATCH_SIZE = 25;
const TOKENS_PER_MINUTE_LIMIT = 250_000;
const METADATA_LIMIT = 40960;

// === UTIL ===
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const estimateTokens = (text) =>
  Math.ceil((text || "").split(/\s+/).length * 0.75);

function estimateMetadataSize(metadata) {
  return Buffer.byteLength(JSON.stringify(metadata), 'utf8');
}

async function main() {
  const start = performance.now();

  console.log("📦 Reading project data...");
  const raw = await readFile(JSON_FILE_PATH, "utf-8");
  const projects = JSON.parse(raw);

  if (!Array.isArray(projects))
    throw new Error("projects.json must contain an array of objects");

  console.log(`📊 Loaded ${projects.length} projects`);

  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

  // Create index if it doesn't exist
  const { indexes } = await pc.listIndexes();
  const indexNames = indexes.map((i) => i.name);
  if (!indexNames.includes(INDEX_NAME)) {
    console.log("🧠 Creating Pinecone index...");
    await pc.createIndexForModel({
      name: INDEX_NAME,
      cloud: "aws",
      region: "us-east-1",
      embed: {
        model: EMBED_MODEL,
        fieldMap: { text: "chunk_text" },
      },
      waitUntilReady: true,
    });
  }

  const index = pc.index(INDEX_NAME).namespace(NAMESPACE);

  // Format records
  const records = projects.map((project, idx) => ({
    _id: `project-${idx}`,
    chunk_text: `${project.caption}\n${project.description}`,
    title: project.title,
    caption: project.caption,
    url: project.url,
    videoLink: project.videoLink,
    techUsed: project.techUsed,
    externalLinks: project.externalLinks,
    hackathon: project.hackathon,
  }));
  
  const validRecords = [];
  const skippedIds = [];

  for (const record of records) {
    const size = estimateMetadataSize(record);
    if (size <= METADATA_LIMIT) {
      validRecords.push(record);
    } else {
      skippedIds.push(record._id);
    }
  }

  console.log(`✅ Filtered valid records: ${validRecords.length}`);
  console.log(`⚠️ Skipped ${skippedIds.length} oversized records:`, skippedIds.slice(0, 5), skippedIds.length > 5 ? '...' : '');

  // Batch upserts
  console.log("🚀 Starting batch upsert...");
  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const batch = validRecords.slice(i, i + BATCH_SIZE);
    const tokenCount = batch.reduce(
      (sum, r) => sum + estimateTokens(r.chunk_text),
      0
    );

    await index.upsertRecords(batch);
    console.log(
      `✅ Upserted batch ${i / BATCH_SIZE + 1} (${i + 1}-${i + batch.length}) – ${tokenCount} tokens`
    );

    const delayMs = Math.max((tokenCount / TOKENS_PER_MINUTE_LIMIT) * 60000, 2000);
    console.log(`⏳ Sleeping ${Math.round(delayMs)}ms...`);
    await sleep(delayMs);
  }

  const end = performance.now();
  const mins = Math.floor((end - start) / 60000);
  const secs = Math.round(((end - start) % 60000) / 1000);
  console.log(`⏰ Finished in ${mins}m ${secs}s`);
  console.log("🎉 All projects uploaded successfully to Pinecone!");
}

main().catch((err) => {
  console.error("❌ Error during upsert:", err);
});
