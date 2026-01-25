const { generateAnswer } = require('../utils/aiService'); // You might need to expose the raw chat model instead for JSON mode

exports.visualizeNote = async (req, res) => {
    const { text } = req.body;
    
    // Prompt specifically optimized for React Flow
    const prompt = `
      Analyze the following text and create a concept map. 
      Return ONLY a valid JSON object (no markdown formatting).
      Structure:
      {
        "nodes": [
          {"id": "1", "label": "Main Topic", "position": {"x": 0, "y": 0}}
        ],
        "edges": [
          {"id": "e1-2", "source": "1", "target": "2", "label": "connection"}
        ]
      }
      
      Text to analyze: "${text.substring(0, 3000)}"
    `;

    try {
        // Reuse your aiService or call model directly
        const jsonStr = await generateAnswer(prompt, ""); 
        // Note: You might need to strip markdown code blocks ```json ... ``` if Gemini includes them
        const cleanJson = jsonStr.replace(/```json|```/g, '').trim();
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Visualization failed" });
    }
};