# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the auth router (keep existing)
from .api import auth
# Import the new routers
from .api import settings
from .api import generation


# Initialize the FastAPI application
app = FastAPI()

# --- CORS Configuration ---
# Make sure the frontend origin is correctly listed here
origins = [
    "http://localhost:3000", # Example for Create React App
    "http://localhost:5173", # Example for Vite React App
    # Add other origins if needed (e.g., production domain)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- End CORS Configuration ---


# Define a simple root endpoint (keep existing)
@app.get("/")
async def read_root():
    """
    Basic root endpoint to verify the API is running.
    """
    return {"message": "Worldforge Backend Running!"}

# --- Include Routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"]) # Include settings router
app.include_router(generation.router, prefix="/api/generation", tags=["generation"]) # Include generation router
# --- End Include Routers ---

# You can include other routers here later (e.g., simulation, chat, world management)
# from .api import simulation, chat, world # Example imports
# app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
# app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
# app.include_router(world.router, prefix="/api/world", tags=["world"])