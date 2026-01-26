const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

// 0. Safety Check
if (!process.env.GOOGLE_API_KEY) {
    console.error("CRITICAL: GOOGLE_API_KEY is missing in process.env");
}

// 1. Helper for Document Embeddings (Used when saving/ingesting notes)
const getDocumentEmbeddingsModel = () => {
    return new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        taskType: "RETRIEVAL_DOCUMENT",
    });
};

// 2. Helper for Query Embeddings (Used when chatting/searching)
const getQueryEmbeddingsModel = () => {
    return new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        taskType: "RETRIEVAL_QUERY",
    });
};

// 3. Helper for Chat Model
const getChatModel = () => {
    return new ChatGoogleGenerativeAI({
        model: "gemini-flash-latest", // Use latest flash alias which validates against available models
        temperature: 0.2,
        maxOutputTokens: 2048,
    });
};

/**
 * Generates embeddings for the given text (Ingestion).
 */
const generateEmbeddings = async (text) => {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await splitter.createDocuments([text]);

        // Use Document model for ingestion
        const embeddingsModel = getDocumentEmbeddingsModel();
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
 * Generates a single embedding vector for a query (Chat).
 */
const embedQuery = async (query) => {
    try {
        // Use Query model for search (Critical for Google models)
        const embeddingsModel = getQueryEmbeddingsModel();
        return await embeddingsModel.embedQuery(query);
    } catch (error) {
        console.error("Error embedding query:", error);
        throw error;
    }
};

/**
 * Generates an answer using the LLM.
 */
const parseRetryAfterSeconds = (errorDetails) => {
    if (!errorDetails) return null;
    const raw = JSON.stringify(errorDetails);
    const match = raw.match(/retryDelay\":\"(\d+)(?:\.(\d+))?s/i);
    if (!match) return null;
    const seconds = parseInt(match[1], 10);
    return Number.isFinite(seconds) ? seconds : null;
};

const wrapAIError = (error) => {
    const isQuota = error?.status === 429 || /quota|too many requests/i.test(error?.message || '');
    if (!isQuota) return error;

    const retryAfterSeconds = parseRetryAfterSeconds(error?.errorDetails);
    const err = new Error('AI quota exceeded. Please retry later.');
    err.code = 'AI_QUOTA';
    err.status = 429;
    err.retryAfterSeconds = retryAfterSeconds;
    return err;
};

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
        throw wrapAIError(error);
    }
};

/**
 * Generates a knowledge graph from text.
 */
const stripCodeFences = (raw) => {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .trim();
};

const generateKnowledgeGraph = async (text) => {
    try {
        // Create a specific model instance for JSON mode
        const jsonModel = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            temperature: 0.2,
            maxOutputTokens: 2048,
            modelKwargs: {
                response_mime_type: "application/json"
            }
        });

        const systemPrompt = "You are a knowledge graph generator. Extract main concepts as nodes and relationships as edges.";
        // JSON mode prompt engineering
        const userPrompt = `Analyze this text: ${text}. 
        Output STRICT JSON matching this schema:
        {
          "nodes": [
            { "id": "string", "label": "string" }
          ],
          "edges": [
            { "source": "string", "target": "string", "label": "string" }
          ]
        }`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ];

        const response = await jsonModel.invoke(messages);

        // Parse the JSON content with light sanitization for stray code fences
        try {
            const cleaned = stripCodeFences(response.content);
            return JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", response.content);
            throw new Error("Invalid JSON format from AI");
        }

    } catch (error) {
        console.error("Error generating knowledge graph:", error);
        throw wrapAIError(error);
    }
};

module.exports = { generateEmbeddings, embedQuery, generateAnswer, generateKnowledgeGraph };