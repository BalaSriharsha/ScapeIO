#!/bin/bash

cd backend
source venv/bin/activate
./venv/bin/uvicorn app.main:app --reload --port 8000

