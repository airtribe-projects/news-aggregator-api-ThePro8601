# News Aggregator API

The **News Aggregator API** is a backend service that fetches and manages news articles based on user preferences. 
It allows users to register, authenticate, fetch news from external sources, cache articles for efficiency, mark articles 
as read or favorite, and perform keyword-based searches.

---

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [User Authentication](#user-authentication)
  - [User Preferences](#user-preferences)
  - [News Fetching & Caching](#news-fetching--caching)
  - [Marking Articles as Read/Favorite](#marking-articles-as-readfavorite)
  - [Searching News Articles](#searching-news-articles)
- [Caching Mechanism](#caching-mechanism)
- [Error Handling](#error-handling)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Features

**User Authentication** (Register/Login with JWT)  
**Personalized News Fetching** (Based on user preferences)  
**In-Memory Caching** (Reduces API calls to external news services)  
**Mark Articles as Read/Favorite**  
**Search for News by Keywords**  
**Automatic Cache Expiry and Periodic Updates**  

---

## Technologies Used

- **Node.js** - JavaScript runtime for backend development
- **Express.js** - Web framework for creating APIs
- **JWT (jsonwebtoken)** - For authentication
- **bcryptjs** - Password hashing for security
- **Axios** - To fetch news from external APIs
- **dotenv** - To manage environment variables

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/news-aggregator-api.git
cd news-aggregator-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=3000
JWT_SECRET=your_secret_key
NEWS_API_KEY=your_newsapi_key
```

### 4. Start the Server

```bash
node app.js
```

By default, the server runs on `http://localhost:3000/`.

---

## API Endpoints

### User Authentication

#### 1. Register a New User

`POST /register`

Registers a new user with a username and password.

**Request:**

```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "message": "User registered successfully"
}
```

#### 2. User Login

`POST /login`

Authenticates a user and returns a JWT token.

**Request:**

```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "your_jwt_token"
}
```

**Note:** Include the token in the `Authorization` header as:  
`Authorization: Bearer your_jwt_token`  

---

### User Preferences

#### 3. Get User Preferences

`GET /user/preferences`

Returns the stored news preferences for the authenticated user.

**Response:**

```json
{
  "preferences": {
    "categories": ["technology", "sports"],
    "language": "en"
  }
}
```

#### 4. Update User Preferences

`PUT /user/preferences`

Updates the user’s preferred news categories and language.

**Request:**

```json
{
  "categories": ["technology", "business"],
  "language": "en"
}
```

**Response:**

```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "categories": ["technology", "business"],
    "language": "en"
  }
}
```

---

### News Fetching & Caching

#### 5. Fetch News Articles

`GET /news`

Fetches news based on user preferences. If news is available in the cache, it returns cached articles; otherwise, it fetches from an external API.

**Response (if cache is used):**

```json
{
  "message": "News fetched from cache",
  "articles": [...]
}
```

**Response (if API is used):**

```json
{
  "message": "News fetched from API",
  "articles": [...]
}
```

---

### Marking Articles as Read/Favorite

#### 6. Mark an Article as Read

`POST /news/:id/read`

Marks a specific article as read by the user.

**Response:**

```json
{
  "message": "Article marked as read",
  "readArticles": ["12345"]
}
```

#### 7. Mark an Article as Favorite

`POST /news/:id/favorite`

Marks a specific article as a favorite.

**Response:**

```json
{
  "message": "Article added to favorites",
  "favoriteArticles": ["67890"]
}
```

#### 8. Get All Read Articles

`GET /news/read`

**Response:**

```json
{
  "readArticles": ["12345", "23456"]
}
```

#### 9. Get All Favorite Articles

`GET /news/favorites`

**Response:**

```json
{
  "favoriteArticles": ["67890"]
}
```

---

### Searching News Articles

#### 10. Search for News by Keyword

`GET /news/search/:keyword`

Returns news articles that contain the specified keyword in their title or description.

**Example:**  
`GET /news/search/technology`

**Response:**

```json
{
  "articles": [
    {
      "title": "Latest Technology Innovations",
      "description": "Tech industry is evolving rapidly..."
    }
  ]
}
```

---

## Caching Mechanism

- News articles are cached for **10 minutes** using an in-memory object (`newsCache`).
- Cached articles expire and get deleted after **10 minutes**.
- A background task **updates the cache every 10 minutes** to ensure fresh news.

**Advantage:** Reduces API calls to external news services and improves performance.

---

## Error Handling

The API handles errors gracefully with proper status codes and messages:

- **400 Bad Request:** Invalid input from the user
- **401 Unauthorized:** Missing or invalid authentication token
- **404 Not Found:** Resource not found (e.g., no news articles found)
- **500 Internal Server Error:** Unexpected server issues

---

## Future Enhancements

Possible improvements:

- **Database Integration** (store user data & preferences in MongoDB/PostgreSQL)
- **Role-Based Access Control (RBAC)** for different user levels
- **User Notifications** for breaking news in preferred categories
- **Rate Limiting** to prevent abuse of API requests

---

## License

This project is open-source and available under the **MIT License**.

---

### Conclusion

This **News Aggregator API** provides a robust backend for fetching, caching, and managing personalized news articles with authentication. 
It ensures efficiency with caching and allows users to manage their reading preferences. 🚀
