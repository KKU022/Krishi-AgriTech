import { GoogleGenAI, Type } from '@google/genai';
import { CropRecommendationInput, RankedCrop, StructuredDiseaseAnalysisResult, FarmerProfile, normalizeSeason } from './types.js';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item): item is string => typeof item === 'string');
}

function isDiseaseCondition(value: unknown): value is { name: string; pathogenType: string; description: string } {
  if (!isRecord(value)) return false;
  return typeof value.name === 'string' && typeof value.pathogenType === 'string' && typeof value.description === 'string';
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Timeout helper: rejects after 20 seconds
function withTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 20 seconds.')), timeoutMs)
    ),
  ]);
}

/**
 * Generate a plain-language explanation of deterministic crop recommendations.
 * Strictly instructed NOT to invent yields, prices, rainfall, or unmeasured soil properties.
 */
export async function explainCropRecommendations(
  input: CropRecommendationInput,
  rankedCrops: RankedCrop[],
  language: 'en' | 'hi' = 'en'
): Promise<string> {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error('CONFIG_REQUIRED: Gemini API key is missing.');
  }

  const topCrops = rankedCrops.slice(0, 3);
  const prompt = `
You are an agricultural advisor writing a concise, plain-language agronomic summary for an Indian farmer.
Language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.

User Inputs:
- Soil Type: ${input.soilType}
- Sowing Season: ${normalizeSeason(input.season) || 'Unspecified'}
- Water Source: ${input.waterSource}
- Land Area: ${input.landArea} ${input.landAreaUnit}
${input.ph ? `- Soil pH: ${input.ph}` : '- Soil pH: Not tested'}
${input.nitrogen ? `- Nitrogen: ${input.nitrogen} kg/ha` : ''}

Deterministic Rule Matching Results:
${topCrops
  .map(
    (c, i) =>
      `${i + 1}. ${c.cropName} (${c.hindiName}) - Suitability Score: ${c.suitabilityScore}%. Matched rules: ${c.matchedRules.join('; ')}`
  )
  .join('\n')}

STRICT CONSTRAINTS:
1. Use ONLY the provided rule output and user inputs.
2. DO NOT invent yields (e.g. quintals/acre), market prices, projected earnings, exact rainfall millimeters, or unmeasured soil nutrient values.
3. Explain in 2-3 clear, practical paragraphs why these ranked crops match the farmer's soil texture, season, and irrigation reality.
4. Keep the tone respectful, clear, and actionable.
`;

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for factual fidelity
      },
    })
  );

  return response.text?.trim() || 'No explanation generated.';
}

/**
 * Structured Plant Disease Analysis
 * Stripped of EXIF before reaching here. Returns strictly validated JSON.
 */
export async function analyzePlantDisease(
  base64Data: string,
  mimeType: string,
  cropHint?: string,
  language: 'en' | 'hi' = 'en'
): Promise<StructuredDiseaseAnalysisResult> {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error('CONFIG_REQUIRED: Gemini API key is missing.');
  }

  const promptText = `
You are an agronomy specialist evaluating a plant leaf / crop photo for signs of disease, nutrient deficiency, or pest stress.
Farmer Note/Crop Hint: ${cropHint || 'Unspecified plant'}.
Output Language for text fields: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.

Carefully inspect the image:
1. Identify visible symptoms (e.g. chlorosis, necrotic lesions, powdery coating, leaf curl, wilting).
2. List 1 to 3 possible conditions with pathogen type (Fungal, Bacterial, Viral, Pest Infestation, Nutrient Deficiency, Environmental Stress, Unknown).
3. Assign a qualitative certainty level: "low", "medium", or "high" based on image clarity and typical symptom ambiguity.
4. Provide general preventive/cultural measures (e.g. crop rotation, field sanitation, improved drainage, removing infected leaves).
5. State clear recommendation to consult local Krishi Vigyan Kendra (KVK) or block agricultural extension officer before chemical intervention.

DO NOT claim this is a definitive lab diagnosis.
`;

  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleConditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  pathogenType: {
                    type: Type.STRING,
                    description: 'One of: Fungal, Bacterial, Viral, Pest Infestation, Nutrient Deficiency, Environmental Stress, Unknown',
                  },
                  description: { type: Type.STRING },
                },
                required: ['name', 'pathogenType', 'description'],
              },
            },
            visibleSymptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            certaintyLevel: {
              type: Type.STRING,
              description: 'Must be "low", "medium", or "high"',
            },
            generalPreventionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            expertAdviceRecommendation: {
              type: Type.STRING,
            },
          },
          required: [
            'possibleConditions',
            'visibleSymptoms',
            'certaintyLevel',
            'generalPreventionSteps',
            'expertAdviceRecommendation',
          ],
        },
      },
    })
  );

  const rawText = response.text?.trim();
  if (!rawText) {
    throw new Error('AI returned an empty response. Please try again with a clearer image.');
  }

  try {
    const parsed: unknown = JSON.parse(rawText);
    if (!isRecord(parsed)) throw new Error('Structured diagnosis must be an object.');
    const possibleConditions = parsed.possibleConditions;
    const visibleSymptoms = parsed.visibleSymptoms;
    const generalPreventionSteps = parsed.generalPreventionSteps;
    const certaintyLevel = parsed.certaintyLevel;
    const expertAdviceRecommendation = parsed.expertAdviceRecommendation;
    if (!Array.isArray(possibleConditions) || !possibleConditions.every(isDiseaseCondition)) {
      throw new Error('Structured diagnosis contains invalid conditions.');
    }
    if (!isStringArray(visibleSymptoms) || !isStringArray(generalPreventionSteps)) {
      throw new Error('Structured diagnosis contains invalid symptom or prevention lists.');
    }
    if (certaintyLevel !== 'low' && certaintyLevel !== 'medium' && certaintyLevel !== 'high') {
      throw new Error('Structured diagnosis contains an invalid certainty level.');
    }
    if (typeof expertAdviceRecommendation !== 'string') {
      throw new Error('Structured diagnosis is missing its expert recommendation.');
    }
    return { possibleConditions, visibleSymptoms, generalPreventionSteps, certaintyLevel, expertAdviceRecommendation };
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText);
    throw new Error('Unable to parse diagnostic response. Please try again with a clear photo.');
  }
}

/**
 * Farming Assistant Chat with guardrails:
 * - Refuses chemical pesticide dosages
 * - Inquires about missing location/season/crop
 * - Tailors advice to farmer's profile
 */
export async function farmingAssistantChat(
  conversationHistory: Array<{ role: 'user' | 'model'; content: string }>,
  profile?: FarmerProfile,
  language: 'en' | 'hi' = 'en'
): Promise<string> {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error('CONFIG_REQUIRED: Gemini API key is missing.');
  }

  const profileContext = profile
    ? `
Farmer Profile:
- Location: ${profile.district || 'Unspecified'}, ${profile.state || 'India'}
- Soil Type: ${profile.soilType || 'Unspecified'}
- Water Source: ${profile.waterSource || 'Unspecified'}
- Land Area: ${profile.landArea ? `${profile.landArea} ${profile.landAreaUnit || 'acres'}` : 'Unspecified'}
- Farming Interests: ${profile.farmingInterests?.join(', ') || 'General farming'}
`
    : 'No farmer profile on record.';

  const systemInstruction = `
You are AgriTech's dedicated Digital Farming Assistant, specialized in Indian agriculture, agrometeorology, and agronomy.
Response Language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}. Use clean, respectful language suitable for Indian farmers.

${profileContext}

CRITICAL RULES & SAFETY BOUNDARIES:
1. SCOPE: Provide sound guidance on crop care, sowing windows, irrigation timing, soil testing, organic manuring, compost preparation, and integrated weed/pest management (cultural and biological controls).
2. MISSING CONTEXT: If the farmer asks a question without specifying the crop, current growth stage, location/state, or season, proactively ask polite clarifying questions before making broad assertions.
3. CHEMICAL SAFETY MANDATE: NEVER specify exact chemical pesticide dosages or spray concentrations (e.g. "spray 2.5 ml of chlorpyrifos per liter"). Explicitly refuse chemical dosage recommendations and instruct the farmer to strictly read the registered product label and consult their nearest Krishi Vigyan Kendra (KVK) or block agricultural extension officer.
4. GENERAL vs URGENT: Clearly separate general agronomic education from time-sensitive advisories (e.g. frost, water stagnation, or sudden pest outbreak).
5. FACTUAL FIDELITY: Do not promise specific guaranteed crop yields, guaranteed market prices, or assured government scheme disbursements.
`;

  // Format contents for generateContent
  const contents = conversationHistory.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    })
  );

  return response.text?.trim() || 'I was unable to formulate a response. Please try asking again.';
}

// Backwards compatibility aliases
export const analyzeCropDiseaseWithGemini = analyzePlantDisease;
export const chatWithFarmingAssistant = farmingAssistantChat;
