const { generateKnowledgeGraph } = require('../utils/aiService');
const Note = require('../models/Note');
const { extractPlainText } = require('../utils/textProcessing');

exports.visualizeNote = async (req, res) => {
  try {
    // Support both passing ID (preferred) or raw text
    const { noteId, text } = req.body;
    let textToAnalyze = text;

    if (noteId) {
      const note = await Note.findById(noteId);
      if (note) {
        // Check auth if we fetch from DB
        if (note.userId.toString() !== req.user.id) {
          return res.status(403).json({ msg: 'Not authorized' });
        }
        textToAnalyze = extractPlainText(note.content);
      }
    }

    if (!textToAnalyze) {
      return res.status(400).json({ msg: 'No text provided for visualization' });
    }

    const graphData = await generateKnowledgeGraph(textToAnalyze);

    // Post-process to ensure React Flow compatible positions (optional, or let frontend handle layout)
    // For now, we return valid nodes/edges. Frontend (React Flow) usually needs 'position: {x,y}'
    // If the AI didn't generate positions, we can add defaults or let a layout library like dagre handle it on client.
    // Let's ensure nodes have at least a default position to avoid crashes if React Flow requires it strictly.

    const nodes = graphData.nodes.map((node, index) => ({
      ...node,
      // Simple circular layout default if missing
      position: node.position || { x: Math.cos(index) * 200, y: Math.sin(index) * 200 }
    }));

    res.json({ nodes, edges: graphData.edges });
  } catch (error) {
    console.error("Visualization error:", error);
    res.status(500).json({ msg: "Visualization failed" });
  }
};