const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const Joi = require("joi");

const preferencesSchema = Joi.object({
    categories: Joi.array().items(Joi.string()).required(),
    language: Joi.string().required(),
});

const router = express.Router();

// Temporary storage for user preferences
let userPreferences = {};

// GET user preferences
router.get("/preferences", authenticateToken, (req, res) => {
    const username = req.user.username;
    const preferences = userPreferences[username] || { categories: [], language: "en" };

    res.json(preferences);
});

// PUT (Update) user preferences
router.put("/preferences", authenticateToken, (req, res) => {
    const { error } = preferencesSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const username = req.user.username;
    const { categories, language } = req.body;

    userPreferences[username] = { categories, language };

    res.json({ message: "Preferences updated successfully", preferences: userPreferences[username] });
});

module.exports = { router, userPreferences };
