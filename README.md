# AI Second Brain

A production-ready full-stack application that serves as your personal knowledge management system powered by AI. Create notes, upload PDFs, and use AI-powered chat to query your knowledge base with semantic search.

## Features

- 📝 **Rich Text Editor**: BlockNote-powered editor for creating and editing notes
- 📄 **PDF Upload**: Extract and index content from PDF documents
- 🤖 **AI Chat**: Query your knowledge base using Retrieval Augmented Generation (RAG)
- 🔍 **Semantic Search**: Find relevant information using vector embeddings
- 🗺️ **Knowledge Graph**: Visualize your notes as an interactive mind map
- 🔐 **Secure Authentication**: JWT-based user authentication
- ⚡ **Real-time Updates**: Instant note synchronization with debounced auto-save

## Tech Stack

### Frontend
- **React 19** with Vite
- **React Router 7** for navigation
- **Zustand** for state management
- **BlockNote** for rich text editing
- **ReactFlow** for knowledge graph visualization
- **Tailwind CSS 4** for styling
- **Axios** for API communication

### Backend
- **Node.js** with Express 5
- **MongoDB** with Mongoose
- **LangChain** for AI workflows
- **Google Generative AI** (Gemini) for embeddings and chat
- **JWT** for authentication
- **Helmet** for security headers
- **Express Rate Limit** for API protection

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Google API Key (for Generative AI)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MR-SAIRAM-7/ai-second-brain.git
cd ai-second-brain
```

### 2. Install Dependencies

```bash
# Install root dependencies (if any)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit server/.env and add your configurations
```

Required environment variables in `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/ai-second-brain
# For MongoDB Atlas use:
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai-second-brain?retryWrites=true&w=majority

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_secure_jwt_secret_key

# Google Generative AI
GOOGLE_API_KEY=your_google_api_key_here
```

### 4. MongoDB Atlas Vector Search Setup (Required for AI Chat)

If using MongoDB Atlas, you need to create a vector search index:

1. Go to your MongoDB Atlas cluster
2. Navigate to "Search" tab
3. Click "Create Search Index"
4. Choose "JSON Editor"
5. Select your database (`ai-second-brain`) and collection (`chunks`)
6. Paste this configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.userId"
    }
  ]
}
```

7. Name the index: `vector_index`
8. Click "Create Search Index"

**Note**: For local MongoDB, vector search requires MongoDB Atlas or additional setup.

### 5. Get Google API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## Running the Application

### Development Mode

You need to run both the server and client:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Production Build

**Build the client:**
```bash
cd client
npm run build
```

The build output will be in `client/dist/`.

**Run the server in production:**
```bash
cd server
NODE_ENV=production node index.js
```

## Project Structure

```
ai-second-brain/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/            # API client configuration
│   │   ├── components/     # React components
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
│
├── server/                 # Express backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### AI Features
- `POST /api/upload` - Upload and parse PDF
- `POST /api/notes/:id/ingest` - Generate embeddings for note
- `POST /api/chat` - Query knowledge base with AI (rate-limited)
- `POST /api/visualize` - Generate knowledge graph

## Usage

### 1. Register/Login
- Create an account or login with existing credentials
- JWT token is stored in localStorage

### 2. Create Notes
- Click "New Note" to create a rich text note
- Notes auto-save as you type (2-second debounce)

### 3. Upload PDFs
- Click the upload icon to upload PDF documents
- PDFs are automatically parsed and indexed for search

### 4. AI Chat
- Use the chat sidebar to ask questions about your notes
- AI will search your knowledge base and provide answers with sources
- Limited to 60 requests per minute per IP

### 5. Visualize Knowledge
- Generate interactive knowledge graphs from your notes
- Explore relationships between concepts

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Helmet security headers
- CORS protection
- Rate limiting on sensitive endpoints
- Input validation
- Environment variable protection

## Performance Optimizations

- Debounced auto-save (2 seconds)
- Vector search with MongoDB Atlas
- Chunk-based text processing
- React component memoization
- Vite build optimization

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (local) or connection string is correct (Atlas)
- Check firewall settings for MongoDB Atlas
- Verify network access in Atlas dashboard

### Vector Search Not Working
- Verify the `vector_index` is created in MongoDB Atlas
- Check index name matches exactly: `vector_index`
- Ensure dimensions are set to 768 (for text-embedding-004)

### Google API Errors
- Verify API key is valid and has Generative AI API enabled
- Check quota limits in Google Cloud Console
- Ensure GOOGLE_API_KEY is set in environment variables

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version (18+ required)
- Verify all environment variables are set

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please create an issue on the GitHub repository.

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Google Generative AI](https://ai.google.dev/)
- Uses [LangChain](https://js.langchain.com/) for AI workflows
- Rich text editing by [BlockNote](https://www.blocknotejs.org/)
- Knowledge graphs by [ReactFlow](https://reactflow.dev/)
