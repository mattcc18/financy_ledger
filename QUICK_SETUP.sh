#!/bin/bash
# Quick setup script to copy files from original project

SOURCE_DIR="/Users/matthewcorcoran/Desktop/Finance Copy/Finance_Dashboard_React"
TARGET_DIR="/Users/matthewcorcoran/Desktop/Finance Copy/Finance_Dashboard_Final"

echo "Copying project files..."
echo "From: $SOURCE_DIR"
echo "To: $TARGET_DIR"
echo ""

# Copy everything except node_modules and venv
rsync -av --exclude 'node_modules' --exclude 'venv' --exclude '.git' "$SOURCE_DIR/" "$TARGET_DIR/"

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "Next steps:"
echo "1. Create Supabase project"
echo "2. Run supabase_schema_complete.sql in Supabase SQL Editor"
echo "3. Create backend/.env file with your Supabase connection string"
echo "4. Run: cd $TARGET_DIR && python3 -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
echo "5. Start server: cd backend && python run.py"



