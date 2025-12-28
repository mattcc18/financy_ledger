"""
Run script for the FastAPI application.
"""
import uvicorn
import sys

if __name__ == "__main__":
    # Check if port argument provided
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}. Using default port 8000.")
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
