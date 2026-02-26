# LanChain Backend

A Node.js backend for LangChain and LangGraph integration with Google AI Studio (Generative AI API).

## Features

- 🚀 Express.js server with CORS support
- 🤖 Google Generative AI integration (Gemini Pro)
- 🔗 LangChain framework support
- 📊 MongoDB for data persistence
- 🛡️ Environment-based configuration
- 🔄 Auto-reload development server with Nodemon
- 📝 Structured project layout

## Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** or **yarn**
- **Google API Key** from [Google AI Studio](https://aistudio.google.com/api-keys)
- **MongoDB** (local or MongoDB Atlas)

## Setup Instructions

### 1. Get Google API Key

1. Go to [Google AI Studio](https://aistudio.google.com/api-keys)
2. Sign in with your Google account
3. Click "Create API key"
4. Copy your API key (it will look like `AIzaSy...`)

### 2. Create Environment File

Copy the `.env.example` file to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Update the `.env` file with:

```env
GOOGLE_API_KEY=your_api_key_from_step_1
MONGODB_URI=mongodb://localhost:27017/lanchain
PORT=5000
NODE_ENV=development
```

#### MongoDB Connection String Examples

- **Local MongoDB**: `mongodb://localhost:27017/lanchain`
- **MongoDB Atlas Cloud**: `mongodb+srv://username:password@cluster.mongodb.net/lanchain`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

### 5. Test the Server

Check the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-22T10:30:45.123Z",
  "uptime": 2.345
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/        # Configuration files (AI, Database)
│   │   ├── ai.js      # Google GenerativeAI setup
│   │   └── db.js      # MongoDB connection
│   ├── routes/        # API route handlers
│   ├── models/        # MongoDB Mongoose schemas
│   ├── middleware/    # Express middleware
│   ├── utils/         # Utility functions
│   └── index.js       # Main server file
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start with Nodemon (auto-reload on file changes)
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Fix ESLint issues automatically

## Dependencies

### Core
- **express** - Web framework
- **@google/generative-ai** - Google AI API client
- **langchain** - LangChain framework
- **@langchain/google-genai** - LangChain Google integration
- **mongoose** - MongoDB ODM
- **dotenv** - Environment variables management
- **cors** - Cross-Origin Resource Sharing
- **body-parser** - HTTP request body parser

### Dev
- **nodemon** - Auto-reload development server
- **eslint** - Code linting

## Next Steps

1. **Create LangChain Chat Route** - Add `/api/chat` endpoint for conversational AI
2. **Set up LangGraph Workflows** - Create complex multi-step agent workflows
3. **Add MongoDB Models** - Define schemas for conversations, messages, history
4. **Implement Authentication** - Add user authentication with JWT
5. **Add Input Validation** - Use libraries like Joi or Zod for request validation
6. **Create Tests** - Set up Jest or Mocha for testing

## Troubleshooting

### "GOOGLE_API_KEY not set"
- Make sure `.env` file exists in the project root
- Copy `.env.example` to `.env` and add your actual API key
- Restart the server

### "MongoDB connection failed"
- Verify MongoDB is running (local) or cluster is accessible (Atlas)
- Check connection string in `.env`
- Ensure firewall allows connection to MongoDB

### "Port already in use"
- Change `PORT` in `.env` file to an available port
- Or kill the process using the port: `lsof -i :5000`

## Resources

- [Google AI Studio](https://aistudio.google.com)
- [LangChain Documentation](https://js.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Mongoose](https://mongoosejs.com/)

## License

MIT
