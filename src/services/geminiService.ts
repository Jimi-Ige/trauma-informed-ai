import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TraumaInformedResponse {
  reframed_text: string;
  reframing_logic: string;
  analysis: {
    safety_score: number; // 0 to 1
    bias_detected: boolean;
    spiral_risk: number; // 0 to 1
    triggers: {
      phrase: string;
      severity: "low" | "medium" | "high";
      explanation: string;
    }[];
    power_dynamics: {
      issue: string;
      severity: "low" | "medium" | "high";
      explanation: string;
    }[];
    compliance_mapping: string[];
    cultural_analysis: {
      considerations: string[];
      suggested_questions: string[];
      living_arrangement_insight: string;
    };
    emotional_health_design: {
      color_recommendation: string;
      mood_impact: string;
      rationale: string;
    };
  };
}

const TRAUMA_INFORMED_SYSTEM_INSTRUCTION = `
You are a trauma-informed AI assistant designed for healthcare and social care workflows. 
Your goal is to support case managers and care coordinators using principles of:
1. Safety: Ensuring physical and emotional safety.
2. Trustworthiness: Maintaining transparency and clear boundaries.
3. Empowerment: Validating and building on individual strengths.
4. Collaboration: Partnering with the user and the individual being served.
5. Cultural Humility: Recognizing and respecting diverse backgrounds and experiences.

CRITICAL: COLOR PSYCHOLOGY & EMOTIONAL HEALTH
Colors significantly influence human psychology, mood, and mental health.
- 'Plus' colors (yellow, red-yellow) induce positive feelings.
- Natural/pastel shades (soft green, pale brown, pale peach) bring calm, softness, and support.
- Green alleviates stress; pale brown is warm and supportive; soft peach is friendly and caring.
- Avoid placing red (high arousal/danger) alongside sensitive information like self-harm.
- Soft blues and greens subdue stress (reminiscent of nature).
- Purple-blue hues promote calm, harmony, and simplicity.
- Brightness increases pleasure; saturation increases pleasure, arousal, and dominance.
- Consider cultural variations in color perception (e.g., Red = luck in China, danger in West; White = purity in West, mourning in East).

CRITICAL: CULTURAL HUMILITY & RELATIVITY
You must approach every case with cultural humility, which involves:
- Mutual learning and critical self-reflection.
- Recognizing power imbalances in the provider-client relationship.
- Understanding that a person's beliefs and practices are internally logical within their culture.
- Avoiding judgment; there is no "better" or "worse" culture, only differences.
- Being inclusive of all cultures, upbringing styles, and cultural situations.

LIVING ARRANGEMENTS & KINSHIP
- Consider the impact of living arrangements (nuclear vs. extended families, solo living).
- In many cultures (e.g., parts of Africa, Latin America, Asia), extended kinship networks are the primary source of support and identity.
- Do not assume a nuclear family model is the norm or the "ideal" for all clients.

TOOL: KLEINMAN'S QUESTIONS
When appropriate, suggest the provider ask these questions to create shared understanding:
1. What do you need to feel most comfortable and supported in your care here?
2. What do you think caused your concern?
3. Why do you think it started when it did?
4. What do you think your concern does to you? (How does it work?)
5. How severe is your concern?
6. What kind of treatment do you think you should receive?
7. What are the most important results you hope to receive?
8. What are you most worried about?
9. What do you fear most about your concern?

CRITICAL: SPIRAL PREVENTION
You must monitor for "spirals"—obsessive, repetitive, or increasingly detached interactions.
- If you detect a spiral, your response should be "reality-grounding".

FEATURE 2: TRAUMA INFORMED CONSTRAINT ENGINE
Shaping how analysis and suggestions are generated based on ethical rules.
- Avoid stigmatizing language.
- Be empathetic but professional.
- Do not provide medical diagnoses or legal advice.
- Focus on strengths-based communication.

FEATURE 3: TRIGGER & POWER-DYNAMICS DETECTION
Analyze the provider's draft text for:
- Triggering language (using a trauma-informed lexicon).
- Power imbalances (e.g., authoritative tone, paternalism, coercion).
- Classify findings by severity (low, medium, high).

FEATURE 4: AGENCY-SUPPORTIVE REFRAMING
Rewrite the provider's draft to be more empowering and trauma-informed while maintaining the core message.
- Provide a clear explanation of how the revision improves alignment with trauma-informed principles.

You MUST return your response in a structured JSON format.
`;

export async function generateTraumaInformedResponse(
  input: {
    draftText: string;
    scenarioDescription: string;
    setting: string;
    urgency: string;
    tags: string[];
    culturalContext?: string;
  },
  history: { role: "user" | "model"; parts: { text: string }[] }[]
): Promise<TraumaInformedResponse> {
  const prompt = `
  SCENARIO INTAKE:
  - Provider Draft: "${input.draftText}"
  - Scenario: "${input.scenarioDescription}"
  - Setting: "${input.setting}"
  - Urgency: "${input.urgency}"
  - Tags: ${input.tags.join(", ")}
  - Cultural Context: "${input.culturalContext || "Not provided"}"

  Please analyze this intake and provide a trauma-informed reframing, cultural analysis, emotional health design consideration, and safety analysis.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [...history, { role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: TRAUMA_INFORMED_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reframed_text: {
            type: Type.STRING,
            description: "The empowering, trauma-informed version of the provider's draft.",
          },
          reframing_logic: {
            type: Type.STRING,
            description: "Explanation of how the reframing improves the communication.",
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              safety_score: {
                type: Type.NUMBER,
                description: "0 to 1 score for psychological safety.",
              },
              bias_detected: {
                type: Type.BOOLEAN,
                description: "Whether harmful bias was detected.",
              },
              spiral_risk: {
                type: Type.NUMBER,
                description: "0 to 1 score for risk of obsessive looping.",
              },
              triggers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                    explanation: { type: Type.STRING },
                  },
                  required: ["phrase", "severity", "explanation"],
                },
              },
              power_dynamics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    issue: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                    explanation: { type: Type.STRING },
                  },
                  required: ["issue", "severity", "explanation"],
                },
              },
              compliance_mapping: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Principles applied (e.g., 'Safety', 'Empowerment').",
              },
              cultural_analysis: {
                type: Type.OBJECT,
                properties: {
                  considerations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Cultural factors to keep in mind for this specific case.",
                  },
                  suggested_questions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific questions (e.g., from Kleinman) the provider could ask the client.",
                  },
                  living_arrangement_insight: {
                    type: Type.STRING,
                    description: "Insight into how the client's living arrangement might impact their needs or support system.",
                  },
                },
                required: ["considerations", "suggested_questions", "living_arrangement_insight"],
              },
              emotional_health_design: {
                type: Type.OBJECT,
                properties: {
                  color_recommendation: {
                    type: Type.STRING,
                    description: "A specific color (e.g., 'Soft Green', 'Pale Peach') that would be supportive for this interaction.",
                  },
                  mood_impact: {
                    type: Type.STRING,
                    description: "The intended emotional effect of this color.",
                  },
                  rationale: {
                    type: Type.STRING,
                    description: "Why this color is appropriate based on the scenario and draft text.",
                  },
                },
                required: ["color_recommendation", "mood_impact", "rationale"],
              },
            },
            required: ["safety_score", "bias_detected", "spiral_risk", "triggers", "power_dynamics", "compliance_mapping", "cultural_analysis", "emotional_health_design"],
          },
        },
        required: ["reframed_text", "reframing_logic", "analysis"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as TraumaInformedResponse;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {
      reframed_text: input.draftText,
      reframing_logic: "Error processing analysis.",
      analysis: {
        safety_score: 0,
        bias_detected: true,
        spiral_risk: 1,
        triggers: [],
        power_dynamics: [],
        compliance_mapping: ["Error Handling"],
        cultural_analysis: {
          considerations: ["Error parsing cultural context"],
          suggested_questions: [],
          living_arrangement_insight: "No insight available due to error."
        },
        emotional_health_design: {
          color_recommendation: "Neutral",
          mood_impact: "None",
          rationale: "Error in processing."
        }
      },
    };
  }
}
