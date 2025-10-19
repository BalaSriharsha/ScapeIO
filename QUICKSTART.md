# Quick Start Guide

This guide will help you get the Web Scraper application up and running quickly.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- Python 3.9+ installed
- OpenAI API key (optional, but required for full functionality)

## Quick Setup (5 minutes)

### Step 1: Start Docker Containers
```bash
docker-compose up -d
```
Wait for PostgreSQL and Redis to start (about 30 seconds).

### Step 2: Setup Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
cd migrations
chmod +x apply_migrations.sh
./apply_migrations.sh
cd ..
```

### Step 3: Configure Gemini API Key (Optional)
Edit `backend/.env` and add your Gemini API key:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

Get your API key from: https://ai.google.dev/gemini-api/docs

Without an API key, the app will work but use placeholder responses.

### Step 4: Setup Frontend
```bash
cd ../frontend
npm install
```

## Running the Application

### Option 1: Using Shell Scripts (macOS/Linux)
```bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/api/docs

## First Steps

1. **Register an Account**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Create your account

2. **Create a Scraping Job**
   - Login to your account
   - Click "New Job"
   - Enter a job name and website URL
   - Click "Create Job"

3. **Wait for Completion**
   - The job will show "processing" status
   - Wait a few minutes for scraping to complete
   - Status will change to "completed"

4. **Get Embed Code**
   - Click "Get Embed Code" on completed job
   - Copy the JavaScript code
   - Paste into any HTML file

5. **Test the Chatbot**
   - Create a simple HTML file:
   ```html
   <!DOCTYPE html>
   <html>
   <head><title>Test</title></head>
   <body>
       <h1>My Website</h1>
       <!-- Paste embed code here -->
   </body>
   </html>
   ```
   - Open in browser
   - Click the chatbot button
   - Ask questions about the scraped content

## Troubleshooting

### Docker Issues
```bash
# Check if containers are running
docker ps

# Restart containers
docker-compose restart

# View logs
docker-compose logs
```

### Backend Issues
```bash
# Check if PostgreSQL is accessible
docker exec -it scraper_postgres psql -U scraper_user -d scraper_db

# Check migrations
cd backend
alembic current
alembic upgrade head
```

### Frontend Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .next
npm install
```

### Port Already in Use
If port 8000 or 3000 is in use:
- Backend: `uvicorn app.main:app --reload --port 8001`
- Frontend: Update `NEXT_PUBLIC_API_URL` in `.env.local`

## Default Credentials

There are no default credentials. You must register a new account.

## Color Scheme

The UI uses these colors from the provided palette:
- Primary Blue: #134686
- Secondary Red: #ED3F27
- Accent Yellow: #FEB21A
- Background Cream: #FDF4E3

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Scraper
- POST `/api/scraper/jobs` - Create job
- GET `/api/scraper/jobs` - List jobs
- GET `/api/scraper/jobs/{id}` - Get job details
- DELETE `/api/scraper/jobs/{id}` - Delete job

### Chatbot
- POST `/api/chatbot/embed` - Get embed code
- POST `/api/chatbot/chat` - Chat endpoint (used by widget)

## Features

- User authentication with JWT tokens
- Automatic website crawling (up to 50 pages)
- Vector embeddings using Google Gemini
- Semantic search with pgvector
- RAG-based chatbot responses
- Embeddable widget with custom styling
- Real-time job status updates
- Redis caching for embeddings

## Next Steps

- Customize the color scheme in `frontend/tailwind.config.ts`
- Adjust scraping limits in `backend/app/services/scraper_service.py`
- Configure CORS settings in `backend/app/main.py`
- Set up production environment variables
- Deploy to cloud (Vercel for frontend, Railway/Render for backend)

## Support

For issues or questions, check:
- API Documentation: http://localhost:8000/api/docs
- Backend logs: Check terminal running backend
- Frontend logs: Check browser console
- Docker logs: `docker-compose logs`

Enjoy building AI-powered chatbots!

