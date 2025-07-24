import { Pinecone } from "@pinecone-database/pinecone";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({ region: "us-east-1" });

let pineconeClient;
async function getPineconeClient() {
  if (!pineconeClient) {
    const secretValue = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: process.env.PINECONE_SECRET_NAME })
    );
    const apiKey = secretValue.SecretString;
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const query = body.query || "";

  const pc = await getPineconeClient();
  const index = pc
  .index(
    "hackathon-projects",
    "https://hackathon-projects-otstbx7.svc.aped-4627-b74a.pinecone.io"   // <-- your host
  )
  .namespace("projects");

  const result = await index.searchRecords({
    // ANN stage – grab a generous pool first
    query: {
      inputs: { text: query },
      topK: 40,
    },
  
    // Return exactly the attributes your React code expects
    fields: [
      'chunk_text',    // text we indexed and want the reranker to read
      'title',
      'caption',
      'url',
      'videoLink',
      'techUsed',
      'externalLinks',
      'hackathon',
    ],
  
    // Rerank stage – rescore those 40 and keep the best 10
    rerank: {
      model: 'bge-reranker-v2-m3',
      rankFields: ['chunk_text'],   // <‑‑ REQUIRED
      topN: 10,
    },
  });
  

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      projects: result.result.hits.map(h => ({
        _id: h._id,
        ...h.fields           // flatten `fields` for easier rendering
      }))
    })
  };
};

