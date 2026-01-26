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
    let noteDoc = null;

    if (noteId) {
      // Validate noteId format
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ msg: 'Invalid note ID format' });
      }

      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ msg: 'Note not found' });
      }

      noteDoc = note;

      // Check authorization
      if (note.userId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to access this note' });
      }
      
      textToAnalyze = extractPlainText(note.content);
    }

    // Require at least a source (noteId or text). If provided but empty, we'll fallback to a minimal graph.
    const hasSource = Boolean(noteId) || (typeof text === 'string' && text.trim().length > 0);
    if (!hasSource) {
      return res.status(400).json({ msg: 'Provide a noteId or non-empty text to visualize' });
    }

    const minTextLength = 20;
    const normalizedText = (textToAnalyze || '').trim();
    const tooShort = normalizedText.length > 0 && normalizedText.length < minTextLength;

    logger.info('Generating knowledge graph', { 
      userId: req.user.id, 
      textLength: normalizedText.length 
    });
    
    let graphData = null;

    const buildMinimalGraph = () => ({
      nodes: [
        {
          id: noteId ? String(noteId) : 'root',
          label: noteDoc?.title || normalizedText.slice(0, 32) || 'Note'
        }
      ],
      edges: []
    });

    // If text missing or too short, fall back to a minimal graph instead of erroring
    if (!normalizedText || tooShort) {
      logger.warn('Text missing or too short for LLM graph, returning minimal graph', {
        userId: req.user.id,
        length: normalizedText.length
      });
      graphData = buildMinimalGraph();
    } else {
      graphData = await generateKnowledgeGraph(normalizedText);
    }

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

    const uniqueNodes = [];
    const seenNodeIds = new Set();
    nodes.forEach((n) => {
      if (!seenNodeIds.has(n.id)) {
        seenNodeIds.add(n.id);
        uniqueNodes.push(n);
      }
    });

    const nodeIdSet = new Set(uniqueNodes.map((n) => n.id));

    // Validate edges
    const edges = graphData.edges.map((edge, index) => {
      if (!edge.source || !edge.target) {
        logger.warn('Edge missing source or target', { edge });
        return null;
      }

      if (!nodeIdSet.has(String(edge.source)) || !nodeIdSet.has(String(edge.target))) {
        logger.warn('Edge references missing node', { edge });
        return null;
      }

      return {
        id: edge.id || `edge-${index}`,
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label || ''
      };
    }).filter(Boolean); // Remove null entries

    const safeNodes = uniqueNodes.length > 0 ? uniqueNodes : [{ id: noteId ? String(noteId) : 'root', label: noteDoc?.title || 'Note' }];
    const safeEdges = safeNodes.length > 1 ? edges : [];

    logger.success('Knowledge graph generated', { 
      userId: req.user.id,
      nodes: safeNodes.length, 
      edges: safeEdges.length 
    });

    res.json({ nodes: safeNodes, edges: safeEdges });
  } catch (error) {
    logger.error('Visualization failed', error, { userId: req.user?.id });
    
    const isQuota = error?.code === 'AI_QUOTA' || error?.status === 429;
    const status = isQuota ? 429 : 500;

    // Provide more specific error messages
    let errorMessage = isQuota
      ? 'AI quota exceeded. Please retry in a minute.'
      : 'Failed to generate visualization';
    
    if (!isQuota && error.message && error.message.includes('JSON')) {
      errorMessage = 'AI returned invalid data format';
    } else if (!isQuota && error.message && error.message.includes('API')) {
      errorMessage = 'AI service temporarily unavailable';
    } else if (!isQuota && error.message) {
      errorMessage = error.message;
    }

    const payload = { msg: errorMessage };
    if (isQuota && error.retryAfterSeconds) {
      payload.retryAfterSeconds = error.retryAfterSeconds;
    }

    res.status(status).json({ 
      ...payload,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
