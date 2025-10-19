#!/bin/bash

echo "Setting up Web Scraper Application..."

echo "Starting Docker containers..."
docker-compose up -d

echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
cd migrations
chmod +x apply_migrations.sh
./apply_migrations.sh
cd ..

echo "Backend setup complete!"

cd ..

echo "Setting up frontend..."
cd frontend

echo "Installing Node dependencies..."
npm install

echo "Frontend setup complete!"

cd ..

echo ""
echo "Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Don't forget to add your OPENAI_API_KEY to backend/.env"
echo ""

