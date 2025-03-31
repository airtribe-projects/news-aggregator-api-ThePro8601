const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const newsCache = {};
const CACHE_TTL = 10 * 60 * 1000; // Cache expires after 10 minutes
const { userPreferences } = require("./routes/preferences");
let readArticles = {};
let favoriteArticles = {};
const NEWS_API_KEY = process.env.NEWS_API_KEY;

require("dotenv").config(); // Load environment variables

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET; // Get secret key from .env
if (!SECRET_KEY) {
    console.error("Error: JWT_SECRET is not defined in .env file");
    process.exit(1);
}

let users = []; // Temporary in-memory user storage

// Middleware for authentication
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
        req.user = users.find(u => u.username === decoded.username);
        if (!req.user) {
            return res.status(404).json({ message: "User not found" });
        }
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token" });
    }
};

// User Registration
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if password length is at least 6 characters
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    if (users.some((u) => u.username === username)) {
        return res.status(400).json({ message: "Username already taken" });
    }

    // Hash password before storing (if not already implemented)
    const hashedPassword = bcrypt.hashSync(password, 10);
    users.push({ username, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
});

// User Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
});

// Get User Preferences
app.get("/user/preferences", authMiddleware, (req, res) => {
    res.json({ preferences: req.user.preferences });
});

// Update User Preferences
app.put("/user/preferences", authMiddleware, (req, res) => {
    const { categories, language } = req.body;
    req.user.preferences = { categories, language };
    res.json({ message: "Preferences updated successfully", preferences: req.user.preferences });
});

app.get("/news", authMiddleware, async (req, res) => {
    const username = req.user.username;
    const userPref = req.user.preferences;


    if (!userPref || !userPref.categories || !userPref.language) {
        return res.status(400).json({ message: "User preferences not set" });
    }

    const cacheKey = `${userPref.categories.join(",")}-${userPref.language}`;
    const cachedData = newsCache[cacheKey];

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        return res.json({ message: "News fetched from cache", articles: cachedData.articles });
    }

    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
            params: {
                category: userPref.categories.join(","),
                language: userPref.language,
                apiKey: NEWS_API_KEY
            }
        });

        if (response.data.articles.length === 0) {
            return res.status(404).json({ message: "No news articles found" });
        }

        newsCache[cacheKey] = {
            articles: response.data.articles,
            timestamp: Date.now()
        };

        res.json({ message: "News fetched from API", articles: response.data.articles });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch news", error: error.message });
    }
});

// Mark news as read
app.post("/news/:id/read", authMiddleware, (req, res) => {
    const username = req.user.username;
    const articleId = req.params.id;

    if (!readArticles[username]) readArticles[username] = new Set();
    readArticles[username].add(articleId);

    res.json({ message: "Article marked as read", readArticles: Array.from(readArticles[username]) });
});

// Mark news as favorite
app.post("/news/:id/favorite", authMiddleware, (req, res) => {
    const username = req.user.username;
    const articleId = req.params.id;

    if (!favoriteArticles[username]) favoriteArticles[username] = new Set();
    favoriteArticles[username].add(articleId);

    res.json({ message: "Article added to favorites", favoriteArticles: Array.from(favoriteArticles[username]) });
});

// Get all read articles
app.get("/news/read", authMiddleware, (req, res) => {
    const username = req.user.username;
    res.json({ readArticles: Array.from(readArticles[username] || []) });
});

// Get all favorite articles
app.get("/news/favorites", authMiddleware, (req, res) => {
    const username = req.user.username;
    res.json({ favoriteArticles: Array.from(favoriteArticles[username] || []) });
});

app.get("/news/search/:keyword", authMiddleware, async (req, res) => {
    const keyword = req.params.keyword.toLowerCase();

    const userPref = req.user.preferences;
    if (!userPref || !userPref.categories || !userPref.language) {
        return res.status(400).json({ message: "User preferences not set" });
    }

    // Use the correct cache key based on user preferences
    const cacheKey = `${userPref.categories.join(",")}-${userPref.language}`;
    let cachedNews = newsCache[cacheKey];

    if (!cachedNews) {
        return res.status(404).json({ message: "No news found in cache. Try fetching news first." });
    }

    // Filter articles by keyword
    let filteredNews = cachedNews.articles.filter(article =>
        article.title.toLowerCase().includes(keyword) ||
        (article.description && article.description.toLowerCase().includes(keyword))
    );

    if (filteredNews.length === 0) {
        return res.status(404).json({ message: "No matching articles found." });
    }

    res.json({ articles: filteredNews });
});



const updateCache = async () => {
    console.log("Updating cached news...");

    for (const username of Object.keys(userPreferences)) {
        const userPref = userPreferences[username];
        if (!userPref || !userPref.categories || !userPref.language) continue;

        const cacheKey = `${username}-${userPref.categories.join(",")}-${userPref.language}`;

        try {
            const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
                params: {
                    category: userPref.categories.join(","),
                    language: userPref.language,
                    apiKey: process.env.NEWS_API_KEY
                }
            });

            if (response.data.articles.length) {
                newsCache[cacheKey] = {
                    articles: response.data.articles,
                    timestamp: Date.now()
                };
                console.log(`Cache updated for ${username}`);
            }
        } catch (error) {
            console.error(`Failed to update cache for ${username}:`, error.message);
        }
    }
};

// Run cache update every 10 minutes
setInterval(updateCache, 10 * 60 * 1000);


const cleanUpCache = () => {
    const now = Date.now();
    Object.keys(newsCache).forEach((key) => {
        if (now - newsCache[key].timestamp > CACHE_TTL) {
            delete newsCache[key];
            console.log(`Cache expired for key: ${key}`);
        }
    });
};

// Run cleanup every 5 minutes
setInterval(cleanUpCache, 5 * 60 * 1000);





// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});
