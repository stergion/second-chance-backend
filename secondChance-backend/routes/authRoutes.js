const express = require('express');
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const saltrounds = 10;

const router = express.Router();

router.post('/register', async (req, res) => {
    logger.info('POST /auth/register called');

    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const email = req.body.email;

        const user = await collection.findOne({ email });

        if (user) {
            logger.error('Email already exists');
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedpwd = bcrypt.hashSync(req.body.password, saltrounds);

        const newUser = await collection.insertOne({
            "email": email,
            "password": hashedpwd,
            "firstName": req.body.firstName,
            "lastName": req.body.lastName,
            "createdAt": new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId
            }
        };
        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);

        logger.info('User registered successfully');

        res.json({ authtoken, email });
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    logger.info('POST /auth/login called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const user = await collection.findOne({ "email": req.body.email });

        if (!user) {
            logger.error('User not found')
            return res.status(404).json({ error: 'User not found' });
        }

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            logger.error('Wrong pasword')
            return res.status(404).json({ error: 'Wrong pasword' });
        }
        
        const payload = {
            user: {
                id: user._id.toString()
            }
        };
        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);

        res.json({ authtoken, userName:user.userName, email:user.email });
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');

    }
});

module.exports = router;