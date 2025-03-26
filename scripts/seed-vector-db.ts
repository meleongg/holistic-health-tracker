const { OpenAIEmbeddings } = require("@langchain/openai");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fsLib = require("fs");

// Load environment variables
dotenv.config({ path: ".env.local" });

interface Treatment {
  treatment_name: string;
  condition_name: string;
  type: "pharmaceutical" | "non-pharmaceutical";
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  evidence_level: string;
  source_url: string;
}

async function seedVectorDatabase() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in environment variables");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Initialize OpenAI embeddings
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPEN_AI_API_KEY,
  });

  // Load treatment data
  const treatmentsData: Treatment[] = JSON.parse(
    fsLib.readFileSync("./treatments-data.json", "utf8")
  );
  console.log(`Loaded ${treatmentsData.length} treatments`);

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < treatmentsData.length; i += batchSize) {
    const batch = treatmentsData.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        treatmentsData.length / batchSize
      )}`
    );

    for (const treatment of batch) {
      try {
        // Create text for embedding
        const text = `Treatment: ${treatment.treatment_name}. Condition: ${treatment.condition_name}. Type: ${treatment.type}. Description: ${treatment.description}`;

        // Generate embedding
        const embedding = await embeddings.embedQuery(text);

        // Insert into Supabase
        const { error } = await supabase.from("treatments_knowledge").insert({
          treatment_name: treatment.treatment_name,
          condition_name: treatment.condition_name,
          type: treatment.type,
          description: treatment.description,
          frequency: treatment.frequency || "daily",
          evidence_level: treatment.evidence_level,
          source_url: treatment.source_url,
          embedding,
        });

        if (error) console.error("Error inserting treatment:", error);
        else
          console.log(
            `Added: ${treatment.treatment_name} for ${treatment.condition_name}`
          );
      } catch (error) {
        console.error(
          `Error processing treatment: ${treatment.treatment_name}`,
          error
        );
      }
    }

    // Delay between batches to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("Database seeding complete!");
}

// Run the function
seedVectorDatabase();
