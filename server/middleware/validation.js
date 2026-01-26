const mongoose = require('mongoose');

/**
 * Validates that the request body contains all required fields
 */
const validateRequiredFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                msg: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Validates MongoDB ObjectId parameters
 */
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: `Invalid ${paramName} format`
            });
        }

        next();
    };
};

/**
 * Sanitizes string inputs to prevent injection attacks
 */
const sanitizeStrings = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove potentially dangerous characters
            return obj.trim();
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }

    next();
};

/**
 * Validates email format
 */
const validateEmail = (req, res, next) => {
    const { email } = req.body;
    
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                msg: 'Invalid email format'
            });
        }
    }

    next();
};

/**
 * Validates password strength
 */
const validatePassword = (req, res, next) => {
    const { password } = req.body;
    
    if (password) {
        if (password.length < 6) {
            return res.status(400).json({
                msg: 'Password must be at least 6 characters long'
            });
        }
    }

    next();
};

module.exports = {
    validateRequiredFields,
    validateObjectId,
    sanitizeStrings,
    validateEmail,
    validatePassword
};
