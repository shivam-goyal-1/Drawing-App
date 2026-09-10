const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const JWT_SECRET = require('../config/jwtSecret');

const authenticationMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.email = decoded.email;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = authenticationMiddleware;