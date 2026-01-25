const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            console.error("No API KEY found");
            return;
        }
        console.log("Using API Key:", process.env.GOOGLE_API_KEY.slice(0, 5) + "...");

        // Fetch models list directly using REST API
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(` - ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }


        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // We can get the model manager
        // Actually, listModels is on the genAI instance or model manager?
        // documentation says: genAI.getGenerativeModel...
        // Wait, how to list models? 
        // It's usually a separate call via REST or maybe not exposed in high level SDK easily?
        // Let's check imports.

        // Actually, let's try to just instantiate a model and see if it works with the raw SDK.
        // If raw SDK fails, it's the key/account.

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        const safetyResponse = await result.response;
        console.log("Raw SDK gemini-1.5-flash success:", safetyResponse.text());

    } catch (e) {
        console.error("Raw SDK failed:", e.message);
    }
};

run();
