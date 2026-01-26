# Deployment Guide - AI Second Brain

This guide covers deploying the AI Second Brain application to production environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Environment Configuration](#environment-configuration)
4. [Frontend Deployment (Vercel/Netlify)](#frontend-deployment)
5. [Backend Deployment (Railway/Render)](#backend-deployment)
6. [Full Stack Deployment (Single Server)](#full-stack-deployment)
7. [Post-Deployment Checklist](#post-deployment-checklist)

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (for production database)
- Google API Key for Generative AI
- Domain name (optional but recommended)
- SSL certificate (usually provided by hosting platform)

## MongoDB Atlas Setup

### 1. Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project or use existing
3. Create a new cluster (Free tier M0 is sufficient for starting)
4. Choose your preferred cloud provider and region
5. Wait for cluster to be created

### 2. Configure Network Access

1. Go to Network Access in Atlas dashboard
2. Click "Add IP Address"
3. For development: Add your IP
4. For production: Add `0.0.0.0/0` (allow access from anywhere) or specific IPs

### 3. Create Database User

1. Go to Database Access
2. Click "Add New Database User"
3. Choose authentication method: Password
4. Create username and strong password
5. Assign role: "Read and write to any database"

### 4. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `ai-second-brain`

Example: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/ai-second-brain?retryWrites=true&w=majority`

### 5. Create Vector Search Index (Critical for AI Chat)

1. Go to your cluster and click "Search"
2. Click "Create Search Index"
3. Choose "JSON Editor"
4. Select database: `ai-second-brain`
5. Select collection: `chunks`
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
9. Wait for index to become active (can take a few minutes)

## Environment Configuration

### Production Environment Variables

Create a `.env` file in the `server` directory with these values:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-second-brain?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_very_secure_random_string_here_at_least_32_characters
JWT_EXPIRATION=7d

# Google Generative AI
GOOGLE_API_KEY=your_google_api_key

# CORS Configuration (comma-separated list)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

**Security Notes:**
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Never commit `.env` to version control
- Use different secrets for staging and production

## Frontend Deployment

### Option 1: Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Build and Deploy:**
```bash
cd client
npm run build
vercel --prod
```

3. **Configure Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add environment variables if needed
   - Set build command: `npm run build`
   - Set output directory: `dist`

4. **Update API Proxy:**
   - Remove Vite proxy configuration from `vite.config.js`
   - Update `client/src/api/axios.js` to use production API URL:
   
```javascript
const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-domain.com/api'
        : '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});
```

### Option 2: Netlify

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Build and Deploy:**
```bash
cd client
npm run build
netlify deploy --prod --dir=dist
```

3. **Configure Redirects for SPA:**
   Create `client/public/_redirects`:
```
/* /index.html 200
```

## Backend Deployment

### Option 1: Railway

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Initialize and Deploy:**
```bash
cd server
railway login
railway init
railway up
```

3. **Add Environment Variables:**
```bash
railway variables set MONGO_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your-secret"
railway variables set GOOGLE_API_KEY="your-key"
railway variables set NODE_ENV="production"
```

### Option 2: Render

1. Create new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
   - Root Directory: `/`
4. Add environment variables in Render dashboard
5. Deploy

### Option 3: Heroku

1. **Install Heroku CLI:**
```bash
npm install -g heroku
```

2. **Create and Deploy:**
```bash
cd server
heroku create your-app-name
heroku config:set MONGO_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret"
heroku config:set GOOGLE_API_KEY="your-key"
heroku config:set NODE_ENV="production"
git push heroku main
```

## Full Stack Deployment (Single Server)

### Using Docker

1. **Create `Dockerfile` in root:**

```dockerfile
# Multi-stage build

# Stage 1: Build client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Server
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
COPY --from=client-builder /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "index.js"]
```

2. **Create `.dockerignore`:**
```
node_modules
npm-debug.log
.env
.git
.gitignore
*/dist
*/build
```

3. **Build and Run:**
```bash
docker build -t ai-second-brain .
docker run -p 5000:5000 \
  -e MONGO_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  -e GOOGLE_API_KEY="your-key" \
  ai-second-brain
```

### Using PM2 (VPS)

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Build Client:**
```bash
cd client
npm run build
```

3. **Configure Nginx to serve client:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend
    location / {
        root /path/to/ai-second-brain/client/dist;
        try_files $uri /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:5000;
    }
}
```

4. **Start Server with PM2:**
```bash
cd server
pm2 start index.js --name ai-second-brain
pm2 save
pm2 startup
```

## Post-Deployment Checklist

### Security
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Environment variables secured
- [ ] Database access restricted to specific IPs
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled
- [ ] Helmet security headers active

### Performance
- [ ] Vector search index created and active
- [ ] Database indexes created
- [ ] Client assets minified and compressed
- [ ] CDN configured (optional)
- [ ] Gzip compression enabled

### Monitoring
- [ ] Health endpoint responding: `/health`
- [ ] Error logging configured
- [ ] Database connection stable
- [ ] API response times acceptable

### Functionality
- [ ] User registration working
- [ ] User login working
- [ ] Note creation/editing working
- [ ] PDF upload working
- [ ] AI chat working (test with sample question)
- [ ] Knowledge graph visualization working

### Testing Commands

```bash
# Test health endpoint
curl https://your-api-domain.com/health

# Test registration
curl -X POST https://your-api-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Test login
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Troubleshooting

### Common Issues

**1. MongoDB Connection Fails**
- Verify connection string is correct
- Check IP whitelist in Atlas
- Ensure database user credentials are correct

**2. Vector Search Not Working**
- Verify index named `vector_index` exists
- Check index is active (not building)
- Verify dimensions are 768

**3. CORS Errors**
- Update ALLOWED_ORIGINS in backend .env
- Ensure frontend domain is whitelisted

**4. API Key Errors**
- Verify GOOGLE_API_KEY is set
- Check API key has Generative AI enabled
- Verify quota hasn't been exceeded

**5. Build Failures**
- Clear node_modules and reinstall
- Check Node.js version (18+ required)
- Verify all environment variables are set

## Scaling Considerations

### For Production Traffic

1. **Database**: Upgrade MongoDB Atlas tier for more storage/connections
2. **Backend**: Use multiple instances with load balancer
3. **Caching**: Add Redis for session management
4. **CDN**: Serve static assets from CDN
5. **Monitoring**: Add application monitoring (e.g., DataDog, New Relic)

## Support

For deployment issues, check:
- Server logs for error details
- MongoDB Atlas monitoring
- Google Cloud Console for API usage
- Application health endpoint

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
