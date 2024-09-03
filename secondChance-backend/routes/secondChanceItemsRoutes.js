const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath); // Specify the upload directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('GET / called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const items = await collection.find({}).toArray();
        res.json(items);
    } catch (e) {
        logger.console.error('oops something went wrong', e);
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
    logger.info('POST / called');
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const lastItem = await collection.find({}).sort({ 'id': -1 }).limit(1).toArray();

        let newItem = req.body;
        newItem.id = (parseInt(lastItem[0]['id']) + 1).toString();
        newItem.date_added = Math.floor(new Date().getTime() / 1000);

        newItem = await collection.insertOne(newItem);

        res.status(201).json(newItem);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    logger.info('GET /:ID called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const item = await collection.findOne({ 'id': req.params.id });

        if (!item) {
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(item);
    } catch (e) {
        next(e);
    }
});

// Update and existing item
router.put('/:id', async (req, res, next) => {
    logger.info('PUT /:id called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const item = await collection.findOne({ 'id': req.params.id });

        if (!item) {
            return res.status(404).send("secondChanceItem not found");
        }

        item['category'] = req.body.category;
        item['condition'] = req.body.condition;
        item['age_days'] = req.body.age_days;
        item['description'] = req.body.description;
        item['age_years '] = Number((req.body.age_days / 365).toFixed(1));
        item['updatedAt '] = new Date();

        const updatedItem = await collection.findOneAndUpdate(
            { 'id': req.params.id },
            {$set: item},
            { returnDocument: 'after' }
        );

        if (updatedItem) {
            res.json({ "uploaded": "success" });
        } else {
            res.json({ "uploaded": "failed" });
        }
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    logger.info('DELETE /:id called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const { deletedCount } = await collection.deleteOne({ 'id': req.params.id });

        if (deletedCount > 0) {
            res.json({ "deleted": "success" });
        } else {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }
    } catch (e) {
        next(e);
    }
});

module.exports = router;
