import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

async function testModel(modelName: string) {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: "Hello, return the word 'success' if you receive this.",
        });
        console.log(`Model ${modelName}: SUCCESS - ${response.text?.trim()}`);
    } catch (error: any) {
        console.log(`Model ${modelName}: FAILED - ${error.message}`);
    }
}

async function main() {
    const models = [
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash-lite"
    ];
    for (const model of models) {
        await testModel(model);
    }
}

main().catch(console.error);