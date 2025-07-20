import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("hackathon-projects").namespace("projects");

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const query = body.query || "";

  const result = await index.searchRecords({
    query: {
      topK: 9,
      inputs: { text: query },
    },
  });

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(result.result.hits),
  };
};
