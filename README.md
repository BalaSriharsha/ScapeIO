# Web Scraper - RAG Chatbot Platform

A full-stack web application that allows users to scrape websites, store content in a vector database, and generate embeddable RAG-based chatbots.

## Features

- User authentication (registration and login)
- Website scraping with automatic content extraction
- Vector embeddings storage using pgvector
- RAG-based chatbot generation
- Embeddable chatbot widget for any website
- Modern UI with custom color palette

## Tech Stack

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Hook Form
- Axios

### Backend
- FastAPI (Python)
- PostgreSQL with pgvector extension
- Redis (caching)
- SQLAlchemy (ORM)
- Manual SQL migrations
- Google Gemini API (embeddings and chat)
- BeautifulSoup4 (web scraping)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL with pgvector
- Redis

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm/yarn
- Python 3.9+
- Google Gemini API key (for embeddings and chat functionality)

## Setup Instructions

### 1. Clone the repository

```bash
cd scraper
```

### 2. Start Docker containers

```bash
docker-compose up -d
```

This will start PostgreSQL (with pgvector) and Redis containers.

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your Gemini API key and other settings
nano .env

# Run migrations
cd migrations
chmod +x apply_migrations.sh
./apply_migrations.sh

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`
Swagger documentation: `http://localhost:8000/api/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### 1. Register and Login
- Navigate to `http://localhost:3000`
- Click "Sign Up" to create an account
- Login with your credentials

### 2. Create a Scraping Job
- Click "New Job" from the dashboard
- Enter a job name and website URL (must start with http:// or https://)
- Click "Create Job"
- The system will scrape up to 50 pages from the domain

### 3. Get Chatbot Embed Code
- Wait for the job to complete (status will show "completed")
- Click "Get Embed Code" for the completed job
- Copy the generated JavaScript code
- Paste it into your HTML file before the closing `</body>` tag

### 4. Use the Chatbot
- The chatbot widget will appear in the bottom-right corner
- Visitors can click it to ask questions
- The chatbot uses RAG to provide answers based on scraped content

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://scraper_user:scraper_password@localhost:5432/scraper_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Migrations

The project uses manual SQL migration files located in `backend/migrations/`.

### Apply migrations
```bash
cd backend/migrations
./apply_migrations.sh
```

Or manually with psql:
```bash
psql postgresql://scraper_user:scraper_password@127.0.0.1:5432/scraper_db -f migrations/001_initial_schema.sql
```

### Create a new migration
1. Create a new file: `migrations/002_your_migration_name.sql`
2. Follow the pattern:
```sql
BEGIN;

-- Your SQL changes here

-- Record this migration
INSERT INTO migrations (filename) VALUES ('002_your_migration_name.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
```

### Rollback migrations
Run the corresponding rollback file:
```bash
psql postgresql://scraper_user:scraper_password@127.0.0.1:5432/scraper_db -f migrations/rollback_001.sql
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Color Palette

The application uses the following color scheme:
- Primary: #134686 (Dark Blue)
- Secondary: #ED3F27 (Red/Coral)
- Accent: #FEB21A (Yellow/Gold)
- Background: #FDF4E3 (Cream)

## Project Structure

```
scraper/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── scraper.py
│   │   │   └── chatbot.py
│   │   ├── services/
│   │   │   ├── scraper_service.py
│   │   │   ├── embedding_service.py
│   │   │   └── chatbot_service.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── main.py
│   ├── migrations/
│   │   └── versions/
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   │   ├── new/
│   │   │   └── embed/[id]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── api.ts
│   │   └── store.ts
│   ├── package.json
│   └── tsconfig.json
└── docker-compose.yml
```

## Notes

- The scraper limits to 50 pages per job to prevent excessive crawling
- Embeddings are cached in Redis for 24 hours to reduce API costs
- The chatbot uses Gemini 1.5 Flash for responses
- Vector similarity search is performed using pgvector's cosine distance
- The application requires a Google Gemini API key for full functionality
- Get your API key from: https://ai.google.dev/gemini-api/docs

## Troubleshooting

### Docker containers not starting
```bash
docker-compose down
docker-compose up -d
```

### Database connection errors
Check that PostgreSQL container is running:
```bash
docker ps
```

### Frontend can't connect to backend
Ensure NEXT_PUBLIC_API_URL is set correctly in `.env.local`

### Gemini API errors
Verify your API key is correct and you have API access enabled

## License

MIT

