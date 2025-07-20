import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const INPUT_FILE = 'winning_projects.json';
const OUTPUT_FILE = 'cleaned_projects.json';

function safeString(val) {
  return typeof val === 'string' ? val.trim() : '';
}

function toArrayOrEmpty(arr) {
  return Array.isArray(arr) ? arr.map(safeString).filter(Boolean) : [];
}

function cleanProject(raw) {
  return {
    title: safeString(raw.title),
    caption: safeString(raw.caption),
    url: safeString(raw.url),
    videoLink: safeString(raw.videoLink),
    description: safeString(raw.description),
    techUsed: toArrayOrEmpty(raw.techUsed),
    externalLinks: toArrayOrEmpty(raw.externalLinks),
    hackathon: safeString(raw.hackathon),
  };
}

async function main() {
  console.log('📂 Reading input data...');
  const raw = await readFile(INPUT_FILE, 'utf-8');
  const projects = JSON.parse(raw);

  if (!Array.isArray(projects)) {
    throw new Error('Expected input JSON to be an array');
  }

  console.log(`🧼 Cleaning ${projects.length} projects...`);
  const cleaned = projects.map(cleanProject);

  console.log(`💾 Writing cleaned data to ${OUTPUT_FILE}`);
  await writeFile(OUTPUT_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log('✅ Done!');
}

main().catch((err) => {
  console.error('❌ Error during cleaning:', err);
});
