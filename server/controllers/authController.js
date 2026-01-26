const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password with higher cost factor for production
        const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            passwordHash
        });

        await user.save();

        console.log(`New user registered: ${email}`);
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Email already exists' });
        }
        
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Return JWT with longer expiration
        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRATION || '7d',
                issuer: 'ai-second-brain',
                audience: 'ai-second-brain-users'
            }
        );

        console.log(`User logged in: ${email}`);
        
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        next(err);
    }
};
