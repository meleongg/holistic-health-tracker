import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple in-memory cache
const CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Create embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { conditionName, description } = await request.json();
    const cacheKey = `${conditionName}-${description || ""}`;

    // Check cache
    const cachedResponse = CACHE.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return NextResponse.json({
        suggestions: cachedResponse.data.suggestions,
        fromCache: true,
      });
    }

    // Generate an embedding for the condition query
    const query = `${conditionName} ${description || ""}`.trim();
    const queryEmbedding = await embeddings.embedQuery(query);

    // Retrieve relevant treatment information
    const { data: relevantTreatments, error } = await supabase.rpc(
      "match_treatments",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 10,
      }
    );

    if (error) {
      console.error("Error retrieving treatment information:", error);
      return NextResponse.json(
        { error: "Failed to retrieve treatment information", suggestions: [] },
        { status: 500 }
      );
    }

    // Format retrieved information as context
    let contextInformation = "";
    if (relevantTreatments && relevantTreatments.length > 0) {
      contextInformation = `
        Relevant medical context for ${conditionName}:
        ${relevantTreatments
          .map(
            (t: any) =>
              `- ${t.treatment_name}: ${t.description} Type: ${t.type}. Frequency: ${t.frequency}. Evidence level: ${t.evidence_level}.`
          )
          .join("\n")}
      `;
    }

    // Create augmented prompt with the context
    const prompt = `
      Generate 5 evidence-based treatment options for the medical condition: ${conditionName}.
      ${
        description
          ? `Additional context about the condition: ${description}`
          : ""
      }
      
      ${contextInformation}

      IMPORTANT RESTRICTIONS:
      - Only include over-the-counter (OTC) medications that don't require a prescription
      - Include non-pharmaceutical lifestyle interventions (diet, exercise, etc.)
      - DO NOT include any prescription medications or treatments that require medical supervision
      - Base your recommendations on the provided medical context when relevant

      For each treatment, provide:
      1. A specific name (OTC medication or lifestyle intervention)
      2. Type (either "pharmaceutical" for OTC medications or "non-pharmaceutical" for lifestyle changes)
      3. Recommended frequency (daily, weekly, or monthly)
      4. A brief description of how it works or benefits the condition

      Format the response as a JSON object with a key named "suggestions" containing an array of objects.
      Each object in the "suggestions" array must have keys: name, type, frequency, and description.
      Only include treatments that are well-established, evidence-based, and accessible without a prescription.
    `;

    // Use OpenAI with the enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a wellness assistant helping to suggest evidence-based but accessible treatments for health conditions. Focus on over-the-counter remedies and lifestyle interventions that don't require prescriptions or medical supervision. Provide balanced recommendations prioritizing non-pharmaceutical approaches when appropriate.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Process the response
    try {
      const aiResponseText = response.choices[0].message.content || "{}";
      const aiResponse = JSON.parse(aiResponseText);
      const suggestions = aiResponse.suggestions || [];

      // Add source information when available
      suggestions.forEach((suggestion: any) => {
        // Find if there's a matching source
        const matchedTreatment = relevantTreatments?.find(
          (t: any) =>
            t.treatment_name
              .toLowerCase()
              .includes(suggestion.name.toLowerCase()) ||
            suggestion.name
              .toLowerCase()
              .includes(t.treatment_name.toLowerCase())
        );

        if (matchedTreatment) {
          suggestion.evidence_level = matchedTreatment.evidence_level;
          suggestion.source = "MedlinePlus";
        }
      });

      // Cache the result
      CACHE.set(cacheKey, {
        data: { suggestions },
        timestamp: Date.now(),
      });

      return NextResponse.json({ suggestions });
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("Error generating treatment suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate treatment suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}
