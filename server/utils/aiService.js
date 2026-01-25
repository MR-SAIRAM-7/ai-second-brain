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
        throw error;
    }
};

module.exports = { generateEmbeddings, embedQuery, generateAnswer };