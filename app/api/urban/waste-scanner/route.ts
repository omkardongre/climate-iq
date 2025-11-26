import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

interface WasteAnalysis {
  wasteType: string;
  wasteSubtype: string;
  recyclable: boolean;
  disposalInstructions: string;
  carbonImpact: number;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, userId } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data required" },
        { status: 400 }
      );
    }

    // Extract base64 data (same as analyze-image route)
    const base64Image = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;
    const mimeType = "image/jpeg";

    // Analyze with Gemini Vision (using REST API like analyze-image)
    let analysis: WasteAnalysis;

    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not configured");
      }

      const prompt = `You are a waste classification AI. Analyze this image and identify the waste item.

Provide a JSON response with:
{
  "wasteType": "plastic|paper|metal|glass|organic|electronic|hazardous|textile|other",
  "wasteSubtype": "specific type (e.g., 'PET bottle', 'cardboard box', 'aluminum can')",
  "recyclable": true/false,
  "disposalInstructions": "Clear, actionable disposal instructions (2-3 sentences)",
  "carbonImpact": estimated kg CO2e saved if recycled properly (number),
  "confidence": confidence score 0-100
}

Rules:
1. Be specific about waste subtype
2. Disposal instructions must be practical and location-agnostic
3. Carbon impact: estimate based on typical recycling vs landfill
4. If unsure, set confidence < 70
5. Return ONLY the JSON object, no other text

Example for plastic bottle:
{
  "wasteType": "plastic",
  "wasteSubtype": "PET bottle",
  "recyclable": true,
  "disposalInstructions": "Rinse the bottle, remove the cap and label if possible. Place in the plastic recycling bin. Check local recycling guidelines for PET (#1) plastic acceptance.",
  "carbonImpact": 0.5,
  "confidence": 95
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error("Invalid response from Gemini API");
      }

      const text = data.candidates[0].content.parts[0].text;

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      analysis = JSON.parse(jsonMatch[0]);
    } catch (aiError: any) {
      console.error("Gemini Vision error:", aiError.message);
      return NextResponse.json(
        {
          error: "AI service unavailable",
          message:
            aiError.message ||
            "Failed to analyze waste image. Please try again.",
        },
        { status: 503 }
      );
    }

    // Validate analysis
    if (!analysis.wasteType || !analysis.disposalInstructions) {
      return NextResponse.json(
        {
          error: "Invalid analysis",
          message:
            "AI could not properly analyze the image. Please try a clearer photo.",
        },
        { status: 500 }
      );
    }

    // Return analysis directly - no storage needed
    return NextResponse.json({
      analysis,
    });
  } catch (error: any) {
    console.error("Waste scanner error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze waste" },
      { status: 500 }
    );
  }
}
