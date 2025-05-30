# backend/config/settings.py

import os
from dotenv import load_dotenv

# Load environment variables from a .env file in the backend directory
load_dotenv()

class Settings:
    # --- JWT Settings ---
    # IMPORTANT: Change this to a complex, random string and keep it secret!
    # You can generate one with: openssl rand -hex 32
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-and-difficult-to-guess-key") # CHANGE THIS!
    ALGORITHM: str = "HS256" # Or other algorithms like HS512
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # Token expiration time

    # --- Database Settings (Placeholder for later) ---
    # DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./worldforge.db")

settings = Settings()

# Optional: Create a .env file in your backend directory like this:
# SECRET_KEY="your-actual-generated-secret-key"
# DATABASE_URL="your-database-url-if-using-one"