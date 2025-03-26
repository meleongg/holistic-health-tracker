const axios = require("axios");
const fs = require("fs");
const { parseStringPromise } = require("xml2js");

// Add this import at the top if using TypeScript with type definitions
// const { AxiosError } = require('axios');

// Add these interfaces at the top of your file
interface MedlinePlusDocument {
  $: {
    rank: string;
    url: string;
  };
  content?: Array<{
    $: {
      name: string;
    };
    _: string;
  }>;
}

interface MedlinePlusSearchResult {
  nlmSearchResult: {
    list?: Array<{
      document?: MedlinePlusDocument[];
    }>;
  };
}

async function fetchUsingWebService() {
  try {
    // List of common conditions to search for
    const conditions = [
      "diabetes",
      "hypertension",
      "asthma",
      "arthritis",
      "migraine",
      "depression",
      "anxiety",
      "insomnia",
    ];

    const allResults = [];

    for (const condition of conditions) {
      console.log(`Fetching data for: ${condition}`);

      // Use the MedlinePlus Web Service to search for topics
      const response = await axios.get(`https://wsearch.nlm.nih.gov/ws/query`, {
        params: {
          db: "healthTopics",
          term: condition,
          retmax: 5,
          rettype: "all",
        },
      });

      const result = (await parseStringPromise(
        response.data
      )) as MedlinePlusSearchResult;

      // Correctly process results according to documentation structure
      if (result && result.nlmSearchResult) {
        // Extract documents from the list
        const documents = result.nlmSearchResult.list?.[0]?.document || [];

        allResults.push({
          condition,
          documents: documents.map((doc: MedlinePlusDocument) => {
            // Extract content elements
            const contents: Record<string, string[]> = {};
            if (doc.content) {
              doc.content.forEach((item) => {
                const name = item.$.name;
                if (!contents[name]) {
                  contents[name] = [];
                }
                contents[name].push(item._);
              });
            }

            return {
              rank: doc.$.rank,
              url: doc.$.url,
              contents,
            };
          }),
        });
      }

      // Add delay to respect rate limits (85 requests per minute = ~0.7 sec per request)
      // Using 1.2 seconds to be safe
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    fs.writeFileSync(
      "medlineplus-web-service.json",
      JSON.stringify(allResults, null, 2)
    );

    console.log(`Data saved for ${allResults.length} conditions`);
    return allResults;
  } catch (error) {
    // Error handling code remains the same
    console.error("Error using MedlinePlus Web Service:", error);

    if (error && typeof error === "object" && "message" in error) {
      console.error("Error details:", error.message);
    }

    console.log("Manual download may be required");

    return [];
  }
}

// Call the function
fetchUsingWebService();
