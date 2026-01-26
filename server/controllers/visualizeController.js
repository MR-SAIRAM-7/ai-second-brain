const mongoose = require('mongoose');
const { generateKnowledgeGraph } = require('../utils/aiService');
const Note = require('../models/Note');
const { extractPlainText } = require('../utils/textProcessing');
const logger = require('../utils/logger');

exports.visualizeNote = async (req, res) => {
  try {
    // Support both passing ID (preferred) or raw text
    const { noteId, text } = req.body;
    let textToAnalyze = text;

    if (noteId) {
      // Validate noteId format
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ msg: 'Invalid note ID format' });
      }

      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ msg: 'Note not found' });
      }

      // Check authorization
      if (note.userId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to access this note' });
      }
      
      textToAnalyze = extractPlainText(note.content);
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ msg: 'No text provided for visualization' });
    }

    // Check text length
    if (textToAnalyze.length < 20) {
      return res.status(400).json({ msg: 'Text is too short for meaningful visualization (minimum 20 characters)' });
    }

    logger.info('Generating knowledge graph', { 
      userId: req.user.id, 
      textLength: textToAnalyze.length 
    });
    
    const graphData = await generateKnowledgeGraph(textToAnalyze);

    // Validate graph data
    if (!graphData || !graphData.nodes || !graphData.edges) {
      logger.error('Invalid graph data structure', null, { graphData });
      return res.status(500).json({ 
        msg: 'Failed to generate valid knowledge graph structure' 
      });
    }

    // Ensure nodes have required properties and positions
    const nodes = graphData.nodes.map((node, index) => {
      // Validate node structure
      if (!node.id || !node.label) {
        logger.warn('Node missing id or label', { node });
        return null;
      }

      // Simple circular layout default if missing position
      const angle = (2 * Math.PI * index) / graphData.nodes.length;
      const radius = 200;

      return {
        id: String(node.id),
        label: String(node.label),
        position: node.position || { 
          x: Math.cos(angle) * radius, 
          y: Math.sin(angle) * radius 
        }
      };
    }).filter(Boolean); // Remove null entries

    // Validate edges
    const edges = graphData.edges.map((edge, index) => {
      if (!edge.source || !edge.target) {
        logger.warn('Edge missing source or target', { edge });
        return null;
      }

      return {
        id: edge.id || `edge-${index}`,
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label || ''
      };
    }).filter(Boolean); // Remove null entries

    logger.success('Knowledge graph generated', { 
      userId: req.user.id,
      nodes: nodes.length, 
      edges: edges.length 
    });

    res.json({ nodes, edges });
  } catch (error) {
    logger.error('Visualization failed', error, { userId: req.user?.id });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate visualization';
    
    if (error.message && error.message.includes('JSON')) {
      errorMessage = 'AI returned invalid data format';
    } else if (error.message && error.message.includes('API')) {
      errorMessage = 'AI service temporarily unavailable';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      msg: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
