
import { GoogleGenAI, Type } from "@google/genai";
import type { EcoScoreResponse } from '../types';

// Per guidelines, API key must be from process.env.API_KEY
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ecoScoreResponseSchema = {
    type: Type.OBJECT,
    properties: {
        eco_score: {
            type: Type.OBJECT,
            properties: {
                carbon: { type: Type.NUMBER, description: "Score from 0-100 for carbon footprint. Higher is better." },
                recyclability: { type: Type.NUMBER, description: "Score from 0-100 for recyclability. Higher is better." },
                sourcing: { type: Type.NUMBER, description: "Score from 0-100 for ethical sourcing. Higher is better." }
            },
            required: ["carbon", "recyclability", "sourcing"]
        },
        analysis: { type: Type.STRING, description: "A brief analysis of the product's environmental impact." },
        impact: {
            type: Type.OBJECT,
            properties: {
                co2_per_year_kg: { type: Type.NUMBER, description: "Estimated CO2 saved per year in kg by choosing a better alternative." },
                trees_saved_per_year: { type: Type.NUMBER, description: "Equivalent number of trees saved per year by choosing a better alternative." },
                plastic_bottles_avoided: { type: Type.NUMBER, description: "Equivalent number of plastic bottles avoided per year by choosing a better alternative." }
            },
            required: ["co2_per_year_kg", "trees_saved_per_year", "plastic_bottles_avoided"]
        },
        alternatives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of more sustainable alternative products."
        },
        barcode_detected: {
            type: Type.STRING,
            description: "The barcode detected from the image, if any."
        }
    },
    required: ["eco_score", "analysis", "impact", "alternatives"]
};


export const getEcoScoreFromImage = async (imageBase64: string, mimeType: string, barcode?: string): Promise<EcoScoreResponse> => {
    const model = 'gemini-2.5-flash';

    const prompt = `Analyze the product in the image and provide an eco-score. ${barcode ? `The user-provided barcode is ${barcode}. Cross-reference with it.` : 'If you can detect a barcode in the image, please use it to identify the product.'} 
    Act as an environmental expert. Your analysis should be critical and informative. Provide scores from 0-100 for carbon footprint (production and transport), recyclability (packaging and product), and ethical sourcing (materials and labor). 
    Also, provide a brief analysis paragraph, quantifiable positive environmental impact statistics (like CO2, trees saved, plastic bottles avoided per year by switching to a better alternative), and suggest 2-3 specific, readily available, more sustainable alternative products, including an estimated price range (e.g., "$15-25").
    Return the result in JSON format that adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
    `;
    
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [imagePart, textPart] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: ecoScoreResponseSchema,
                temperature: 0.2,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as EcoScoreResponse;

    } catch (e) {
        console.error("Error getting eco score from Gemini:", e);
        if (e instanceof Error) {
            if (e.message.includes('API_KEY')) {
                 throw new Error("Invalid or missing API Key. Please ensure your API_KEY is correctly configured.");
            }
             if (e.message.includes('JSON')) {
                 throw new Error("The model returned an invalid response. Please try again.");
             }
        }
        throw new Error("Failed to get a valid eco-score from the API. The service may be temporarily unavailable.");
    }
};

export const getEcoScoreFromUrl = async (productUrl: string): Promise<EcoScoreResponse> => {
    const model = 'gemini-2.5-flash';

    const prompt = `Analyze the product from the following URL: ${productUrl}.
    Act as an environmental expert. Your analysis should be critical and informative. Provide scores from 0-100 for carbon footprint (production and transport), recyclability (packaging and product), and ethical sourcing (materials and labor). 
    Also, provide a brief analysis paragraph, quantifiable positive environmental impact statistics (like CO2, trees saved, plastic bottles avoided per year by switching to a better alternative), and suggest 2-3 specific, readily available, more sustainable alternative products, including an estimated price range (e.g., "$15-25").
    Return the result in JSON format that adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: ecoScoreResponseSchema,
                temperature: 0.2,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as EcoScoreResponse;

    } catch (e) {
        console.error("Error getting eco score from Gemini (URL):", e);
        if (e instanceof Error) {
            if (e.message.includes('API_KEY')) {
                 throw new Error("Invalid or missing API Key. Please ensure your API_KEY is correctly configured.");
            }
             if (e.message.includes('JSON')) {
                 throw new Error("The model returned an invalid response. Please try again.");
             }
        }
        throw new Error("Failed to get a valid eco-score from the API. The service may be temporarily unavailable.");
    }
};