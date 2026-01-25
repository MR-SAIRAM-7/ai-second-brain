const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

// Helper to get or initialize embeddings model
const getEmbeddingsModel = () => {
    return new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        taskType: "RETRIEVAL_DOCUMENT",
        title: "Document Embedding"
    });
};

// Helper to get or initialize chat model
const getChatModel = () => {
    return new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0.2,
        maxOutputTokens: 2048,
    });
};

/**
 * Generates embeddings for the given text.
 * Splits text into chunks and generates a vector for each chunk using Gemini.
 * 
 * @param {string} text - The input text to chunk and embed.
 * @returns {Promise<Array<{text: string, vector: number[]}>>} - Array of chunks with their vectors.
 */
const generateEmbeddings = async (text) => {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await splitter.createDocuments([text]);
        const embeddingsModel = getEmbeddingsModel();
        const vectors = await embeddingsModel.embedDocuments(docs.map(doc => doc.pageContent));

        return docs.map((doc, index) => ({
            text: doc.pageContent,
            vector: vectors[index],
            metadata: doc.metadata
        }));

    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
    }
};

/**
 * Generates a single embedding vector for a query string.
 * Uses the same model as document embedding for compatibility.
 * 
 * @param {string} query - The search query.
 * @returns {Promise<number[]>} - The embedding vector.
 */
const embedQuery = async (query) => {
    try {
        const embeddingsModel = getEmbeddingsModel();
        return await embeddingsModel.embedQuery(query);
    } catch (error) {
        console.error("Error embedding query:", error);
        throw error;
    }
};

/**
 * Generates an answer using the LLM based on context and query.
 * 
 * @param {string} query - The user's question.
 * @param {string} context - The retrieved context from vector search.
 * @returns {Promise<string>} - The generated answer.
 */
const generateAnswer = async (query, context) => {
    try {
        const messages = [
            new SystemMessage("You are a helpful assistant. Use ONLY the following context to answer. If the context is insufficient, reply that you do not know."),
            new HumanMessage(`Context:\n${context}\n\nQuestion: ${query}`)
        ];

        const chatModel = getChatModel();
        const response = await chatModel.invoke(messages);
        return response.content;
    } catch (error) {
        console.error("Error generating answer:", error);
        throw error; // Or return a fallback message
    }
};

/**
 * Generates a knowledge graph JSON structure from the given text.
 * 
 * @param {string} text - The input text.
 * @returns {Promise<Object>} - The JSON object with nodes and edges.
 */
const generateKnowledgeGraph = async (text) => {
    try {
        const chatModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            temperature: 0.1, // Low temperature for deterministic JSON
            maxOutputTokens: 2048,
            modelKwargs: { "response_format": { "type": "json_object" } } // Force JSON mode if supported or rely on prompt
        });

        const prompt = `
        Analyze the following text and extract key concepts and their relationships.
        Output purely valid JSON with the following structure:
        {
            "nodes": [
                { "id": "1", "label": "Concept Name" }
            ],
            "edges": [
                { "source": "1", "target": "2", "label": "relationship description" }
            ]
        }
        
        Ensure node IDs are unique strings.
        Limit to the most important top 10-15 concepts to keep the graph readable.
        
        Text to analyze:
        "${text}"
        `;

        const messages = [
            new SystemMessage("You are a specialized AI that extracts knowledge graphs from text. You ONLY output valid JSON."),
            new HumanMessage(prompt)
        ];

        const response = await chatModel.invoke(messages);

        // Sanitize output in case of markdown blocks
        let cleanJson = response.content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Error generating knowledge graph:", error);
        throw error;
    }
};

module.exports = { generateEmbeddings, embedQuery, generateAnswer, generateKnowledgeGraph };
