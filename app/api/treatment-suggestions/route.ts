import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client with the correct environment variable name
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// Simple in-memory cache (will reset on server restart)
const CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function POST(request: Request) {
  try {
    const { conditionName, description } = await request.json();

    // Create a cache key based on the condition name and description
    const cacheKey = `${conditionName}-${description || ""}`;

    // Check if we have a valid cached response
    const cachedResponse = CACHE.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return NextResponse.json({
        suggestions: cachedResponse.data.suggestions,
        fromCache: true,
      });
    }

    // Update your prompt
    const prompt = `
      Generate 5 evidence-based treatment options for the medical condition: ${conditionName}.
      ${
        description
          ? `Additional context about the condition: ${description}`
          : ""
      }

      For each treatment, provide:
      1. A specific name (medication name or lifestyle intervention)
      2. Type (either "pharmaceutical" or "non-pharmaceutical")
      3. Recommended frequency (daily, weekly, or monthly)
      4. A brief description of how it works or benefits the condition

      Format the response as a JSON object with a key named "suggestions" containing an array of objects.
      Each object in the "suggestions" array must have keys: name, type, frequency, and description.
      Example format: { "suggestions": [ { "name": "...", "type": "...", "frequency": "...", "description": "..." }, ... ] }
      Only include treatments that are well-established and evidence-based.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a medical assistant helping to suggest evidence-based treatments for medical conditions. Provide balanced recommendations including both pharmaceutical and lifestyle interventions when appropriate.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    try {
      const aiResponseText = response.choices[0].message.content || "{}";
      const aiResponse = JSON.parse(aiResponseText);

      // Check each possible field name the AI might use
      const suggestions =
        aiResponse.suggestions ||
        aiResponse.treatment_options ||
        aiResponse.treatments ||
        [];

      // Store in cache
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

    // Check for rate limiting errors - with proper typing
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 429
    ) {
      return NextResponse.json(
        {
          error: "The AI service is currently busy. Please try again later.",
          suggestions: [],
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate treatment suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}
