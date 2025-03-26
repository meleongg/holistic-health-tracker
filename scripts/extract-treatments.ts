const fileSystem = require("fs");

// Define interfaces for your data structures
interface MedlinePlusContent {
  [key: string]: string[];
}

interface MedlinePlusDocument {
  rank: string;
  url: string;
  contents: MedlinePlusContent;
}

interface ConditionData {
  condition: string;
  documents: MedlinePlusDocument[];
}

interface Treatment {
  treatment_name: string;
  condition_name: string;
  type: "pharmaceutical" | "non-pharmaceutical";
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  evidence_level: string;
  source_url: string;
}

// Common OTC treatments dictionary to help with identification
const knownTreatments = {
  pharmaceutical: [
    "acetaminophen",
    "tylenol",
    "paracetamol",
    "ibuprofen",
    "advil",
    "motrin",
    "aspirin",
    "naproxen",
    "aleve",
    "antihistamine",
    "decongestant",
    "loratadine",
    "claritin",
    "cetirizine",
    "zyrtec",
    "fexofenadine",
    "allegra",
    "diphenhydramine",
    "benadryl",
    "pseudoephedrine",
    "sudafed",
    "antacid",
    "tums",
    "pepto-bismol",
    "omeprazole",
    "prilosec",
    "famotidine",
    "pepcid",
    "ranitidine",
    "zantac",
    "melatonin",
    "vitamin",
    "supplement",
    "riboflavin",
    "magnesium",
    "coenzyme q10",
    "iron",
    "calcium",
    "zinc",
    "vitamin d",
    "vitamin b12",
    "multivitamin",
  ],
  nonPharmaceutical: [
    "exercise",
    "physical activity",
    "walking",
    "yoga",
    "stretching",
    "meditation",
    "relaxation technique",
    "deep breathing",
    "massage",
    "acupuncture",
    "acupressure",
    "diet",
    "nutrition",
    "hydration",
    "water intake",
    "sleep hygiene",
    "good sleep habits",
    "stress management",
    "counseling",
    "therapy",
    "cognitive behavioral therapy",
    "heat therapy",
    "cold therapy",
    "ice pack",
    "heating pad",
    "compression",
    "rest",
    "elevation",
    "lifestyle change",
    "weight management",
    "biofeedback",
  ],
};

// Load the data you collected
const medlinePlusData: ConditionData[] = JSON.parse(
  fileSystem.readFileSync("./medlineplus-web-service.json", "utf8")
);

// Create a structure to hold the extracted treatments
const treatments: Treatment[] = [];

// Extract treatments from the data
function extractTreatments(): void {
  console.log(`Processing ${medlinePlusData.length} conditions...`);

  for (const conditionData of medlinePlusData) {
    const conditionName = conditionData.condition;
    console.log(`Processing condition: ${conditionName}`);

    // For each document related to the condition
    for (const doc of conditionData.documents || []) {
      // Treatment-related content is often in fullSummary or snippet
      const summaries = doc.contents?.FullSummary || [];
      const snippets = doc.contents?.snippet || [];
      const titles = doc.contents?.title || [];

      // We'll extract treatment phrases from this content
      const allContent = [...summaries, ...snippets, ...titles].join(" ");

      // Extract treatments based on keywords
      extractTreatmentsFromText(allContent, conditionName);
    }
  }

  // Remove duplicates and filter low-quality results
  const cleanedTreatments = filterLowQualityTreatments(treatments);

  // Improve specificity of treatments
  const specificTreatments = improveSpecificity(cleanedTreatments);

  fileSystem.writeFileSync(
    "treatments-data.json",
    JSON.stringify(specificTreatments, null, 2)
  );

  console.log(
    `Extracted ${specificTreatments.length} treatments from ${medlinePlusData.length} conditions`
  );
}

// Helper function to extract treatments from text
function extractTreatmentsFromText(text: string, conditionName: string): void {
  // Clean the text by removing HTML tags
  const cleanedText = text.replace(/<[^>]*>/g, " ");

  // Split into sentences
  const sentences = cleanedText.split(/\.(?:\s|$)/);

  // Treatment indicator phrases (high precision)
  const treatmentPhrases = [
    "is used to treat",
    "are used to treat",
    "helps treat",
    "help treat",
    "is effective for",
    "are effective for",
    "is recommended for",
    "are recommended for",
    "can reduce",
    "can help reduce",
    "can relieve",
    "can help relieve",
    "is a treatment for",
    "are treatments for",
  ];

  for (const sentence of sentences) {
    // Skip very short sentences
    if (sentence.trim().length < 20) continue;

    // Check for pharmaceutical keywords
    const containsPharmaceutical = knownTreatments.pharmaceutical.some((term) =>
      new RegExp(`\\b${term}\\b`, "i").test(sentence)
    );

    // Check for non-pharmaceutical keywords
    const containsNonPharmaceutical = knownTreatments.nonPharmaceutical.some(
      (term) => new RegExp(`\\b${term}\\b`, "i").test(sentence)
    );

    // Try to extract frequency
    let frequency: "daily" | "weekly" | "monthly" = "daily"; // default
    if (/week|weekly/i.test(sentence)) frequency = "weekly";
    if (/month|monthly/i.test(sentence)) frequency = "monthly";

    // Method 1: Extract using known treatment terms
    if (containsPharmaceutical) {
      // Find which treatment term matched
      const matchedTerm = knownTreatments.pharmaceutical.find((term) =>
        new RegExp(`\\b${term}\\b`, "i").test(sentence)
      );

      if (matchedTerm) {
        treatments.push({
          treatment_name:
            matchedTerm.charAt(0).toUpperCase() + matchedTerm.slice(1),
          condition_name: conditionName,
          type: "pharmaceutical",
          description: sentence.trim(),
          frequency: frequency,
          evidence_level: "Moderate",
          source_url: "MedlinePlus",
        });
      }
    }

    if (containsNonPharmaceutical) {
      // Find which treatment term matched
      const matchedTerm = knownTreatments.nonPharmaceutical.find((term) =>
        new RegExp(`\\b${term}\\b`, "i").test(sentence)
      );

      if (matchedTerm) {
        treatments.push({
          treatment_name:
            matchedTerm.charAt(0).toUpperCase() + matchedTerm.slice(1),
          condition_name: conditionName,
          type: "non-pharmaceutical",
          description: sentence.trim(),
          frequency: frequency,
          evidence_level: "Moderate",
          source_url: "MedlinePlus",
        });
      }
    }

    // Method 2: Extract using treatment indicator phrases
    for (const phrase of treatmentPhrases) {
      const index = sentence.toLowerCase().indexOf(phrase);
      if (index !== -1) {
        // Extract the part before the phrase as potential treatment
        const beforePhrase = sentence.substring(0, index).trim();
        // Only use if it's a reasonable length for a treatment name
        if (beforePhrase.length > 3 && beforePhrase.length < 40) {
          // Determine type based on keywords
          const type =
            /medication|medicine|drug|pill|capsule|supplement|vitamin/i.test(
              beforePhrase
            )
              ? "pharmaceutical"
              : "non-pharmaceutical";

          treatments.push({
            treatment_name: beforePhrase,
            condition_name: conditionName,
            type: type,
            description: sentence.trim(),
            frequency: frequency,
            evidence_level: "Moderate",
            source_url: "MedlinePlus",
          });
        }
      }
    }
  }
}

// Filter out low-quality treatment entries
function filterLowQualityTreatments(treatmentList: Treatment[]): Treatment[] {
  // First deduplicate by treatment+condition
  const seen = new Map<string, Treatment>();
  const uniqueTreatments = treatmentList.filter((treatment) => {
    const key = `${treatment.treatment_name.toLowerCase()}|${treatment.condition_name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.set(key, treatment);
    return true;
  });

  // Filter out entries with low-quality treatment names
  return uniqueTreatments.filter((treatment) => {
    const name = treatment.treatment_name;

    // Filter out treatment names that start with common non-treatment words
    const startsWithNonTreatment =
      /^(what|how|who|when|where|why|if|but|the|that|this|these|those|a |an |are|is|can|may|some|many|most|few)\b/i.test(
        name
      );

    // Filter out very short names
    const tooShort = name.length < 4;

    // Filter out names with no alphabetical characters
    const hasNoLetters = !/[a-z]/i.test(name);

    // Filter out names that are just sentence fragments
    const isSentenceFragment =
      /\b(and|or|then|than|because|therefore|however|although|since|until|unless|while|though)\b/i.test(
        name
      );

    return (
      !startsWithNonTreatment &&
      !tooShort &&
      !hasNoLetters &&
      !isSentenceFragment
    );
  });
}

// Add a post-processing step to make treatments more specific
function improveSpecificity(treatments: Treatment[]): Treatment[] {
  return treatments.map((treatment) => {
    const description = treatment.description.toLowerCase();

    // Make therapies more specific
    if (treatment.treatment_name === "Therapy") {
      if (description.includes("oxygen therapy")) {
        treatment.treatment_name = "Oxygen therapy";
      } else if (description.includes("physical therapy")) {
        treatment.treatment_name = "Physical therapy";
      } else if (
        description.includes("cognitive") &&
        description.includes("therapy")
      ) {
        treatment.treatment_name = "Cognitive behavioral therapy";
      } else if (description.includes("heat") || description.includes("cold")) {
        treatment.treatment_name = description.includes("heat")
          ? "Heat therapy"
          : "Cold therapy";
      }
    }

    // Make vitamin references more specific
    if (treatment.treatment_name === "Vitamin") {
      if (
        description.includes("vitamin b2") ||
        description.includes("riboflavin")
      ) {
        treatment.treatment_name = "Vitamin B2 (Riboflavin)";
      } else if (description.includes("vitamin d")) {
        treatment.treatment_name = "Vitamin D";
      } else if (description.includes("vitamin b12")) {
        treatment.treatment_name = "Vitamin B12";
      }
    }

    return treatment;
  });
}

// Run the extraction
extractTreatments();
