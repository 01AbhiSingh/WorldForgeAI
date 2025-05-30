# backend/api/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # For standard login form
from datetime import timedelta
# Import security functions/dependency
from backend.core import security # Imports create_access_token, verify_password, get_password_hash, get_current_user, settings

# Import schemas
from backend.models import schemas # Imports UserCreate, UserResponse, Token

# >>> IMPORT fake_users_db FROM ITS NEW LOCATION <<<
from ..core.fake_db import fake_users_db # Import the temporary in-memory database list
# >>> END IMPORT <<<

# Create an API router for authentication
router = APIRouter()

# --- Helper function to get a user by username from the fake DB ---
# This replaces the logic that was previously in get_current_user
def get_fake_user(username: str) -> dict | None:
    """Find user data in the fake database by username."""
    # Use next() with a default of None if no user is found
    user_data = next((user for user in fake_users_db if user["username"] == username), None)
    return user_data # Returns the dictionary or None


# --- Helper function to authenticate user ---
# Used by the /login endpoint
def authenticate_user(username: str, password: str) -> dict | None:
    """
    Authenticate a user against the fake database.
    Returns the user dictionary if credentials are valid, otherwise None.
    """
    user = get_fake_user(username) # Use the helper to find the user
    if not user:
        return None # User not found

    # Verify the provided password against the hashed password
    # Use the verify_password function from the security module
    if not security.verify_password(password, user["hashed_password"]):
        return None # Password doesn't match

    # Return the user data dictionary if authentication is successful
    return user


# --- Register Endpoint ---
@router.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate):
    """
    Registers a new user in the fake database.
    (In a real app, this would save to a persistent DB)
    """
    # Check if username already exists in the fake database
    if get_fake_user(user.username): # Use the helper to check existence
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Hash the password using the function from the security module
    hashed_password = security.get_password_hash(user.password)

    # Assign a simple sequential ID (temporary)
    new_user_id = len(fake_users_db) + 1

    # Create the new user data dictionary
    new_user_data = {
        "username": user.username,
        "hashed_password": hashed_password,
        "id": new_user_id
    }

    # Add the new user to the fake database list
    fake_users_db.append(new_user_data)

    # Return the created user data (filtered by UserResponse schema)
    # Need to convert the dictionary to a UserResponse schema instance
    # Pydantic's from_attributes=True (or from_orm=True in older versions)
    # allows initializing schema from a dict.
    return schemas.UserResponse(**new_user_data)


# --- Login Endpoint ---
@router.post("/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates a user and returns a JWT access token.
    """
    # Authenticate the user using the helper function
    user = authenticate_user(form_data.username, form_data.password)

    if not user:
        # Raise 401 for invalid credentials
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create an access token for the authenticated user
    # Use the username from the authenticated user dictionary
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )

    # Return the token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"] # Include username here
    }


# --- Protected Test Endpoint (Requires authentication) ---
@router.get("/protected")
async def read_protected(current_user: schemas.UserInDB = Depends(security.get_current_user)):
    """
    Example of a protected endpoint.
    Requires a valid JWT token in the Authorization: Bearer header.
    """
    # If get_current_user succeeds, current_user will be the UserInDB object
    # Print debug info if needed
    # print(f"DEBUG: Accessing protected endpoint as user: {current_user.username}")
    return {"message": f"Hello {current_user.username}, you are authenticated!"}