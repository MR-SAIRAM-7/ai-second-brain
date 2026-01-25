const normalizeWhitespace = (text) => (text || '').replace(/\s+/g, ' ').trim();

// Recursively walk BlockNote-style content and pull out visible text
const collectText = (node) => {
    if (!node) return [];
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(collectText);

    const parts = [];

    if (typeof node.text === 'string') {
        parts.push(node.text);
    }

    if (Array.isArray(node.content)) {
        parts.push(...node.content.flatMap(collectText));
    }

    if (Array.isArray(node.children)) {
        parts.push(...node.children.flatMap(collectText));
    }

    if (Array.isArray(node.blocks)) {
        parts.push(...node.blocks.flatMap(collectText));
    }

    return parts;
};

const extractPlainText = (content) => normalizeWhitespace(collectText(content).join(' '));

module.exports = {
    normalizeWhitespace,
    collectText,
    extractPlainText
};
