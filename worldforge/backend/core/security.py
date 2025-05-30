# backend/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Any, Union

from passlib.context import CryptContext
from jose import JWTError, jwt

# Import necessary FastAPI components for authentication scheme and dependency
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status

from backend.config.settings import settings # Import settings
from backend.models import schemas # Import schemas (UserInDB, TokenData)

# REMOVE THE TEMPORARY IMPORT FROM FAKE_DB
# from .fake_db import fake_users_db # <--- REMOVE THIS IMPORT


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction from the Authorization header (Bearer token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login") # tokenUrl specifies the URL clients can use to get a token

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

def create_access_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # This line should be fixed from the previous step - passing datetime object
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# --- get_current_user dependency (MODIFIED) ---
# Now validates the token and returns a UserInDB object derived from the token payload
# It does NOT lookup fake_users_db itself anymore.
async def get_current_user(token: str = Depends(oauth2_scheme)) -> schemas.UserInDB:
    """
    FastAPI dependency to get the current authenticated user based on the JWT token.
    Validates the token and returns a UserInDB model derived from the token payload.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # print(f"DEBUG: get_current_user received token: {token}") # Keep debug prints
        # print(f"DEBUG: Using secret key: {settings.SECRET_KEY[:5]}...")

        # Decode token payload - This validates signature, expiration, etc.
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # print(f"DEBUG: Token payload decoded: {payload}")

        username: str = payload.get("sub")
        # Check if username exists in the payload
        if username is None:
             print("DEBUG: Token payload missing 'sub' claim (username).") # Add debug
             raise credentials_exception # Token invalid structure

        # We don't look up fake_users_db here anymore.
        # We create a UserInDB object based on the info we got from the *valid* token.
        # We need an 'id' for the UserInDB schema. The token payload doesn't include it.
        # This is a limitation of the fake_db + token approach without putting ID in the token.
        # TEMPORARY WORKAROUND: Assign a dummy ID, or accept UserInDB without ID for now.
        # Let's adjust UserInDB to make id optional OR pass a dummy value.
        # Let's pass a dummy ID for now for the UserInDB model return.
        # In a real app, this would be querying the DB to get the full user object with the real ID.
        dummy_user_id = 0 # Dummy ID for temporary UserInDB derived from token


        token_data = schemas.TokenData(username=username)

        # Create a UserInDB object from the token data
        # Need to provide a hashed_password and id for the UserInDB schema.
        # Hashed password isn't in the token. ID isn't in the token.
        # This highlights why get_current_user normally queries the DB using the username from the token
        # to get the *actual* User object with ID and hashed password.
        # TEMPORARY WORKAROUND: Return a minimal object that satisfies the schema enough for endpoints to work.
        # Or modify UserInDB/UserResponse to make sensitive fields optional in the dependency return.
        # Let's return a minimal object that looks like UserInDB based on username.
        # This might require UserInDB to allow initialization from just username.
        # Revisiting schemas.py -> UserInDB requires username, hashed_password, id.
        # UserResponse requires username, id.
        # The endpoint `read_protected` expects `UserInDB`.
        # Let's create a minimal UserInDB object based *only* on the username from the token.
        # This works IF downstream code only uses `current_user.username`.
        # It's not a TRUE UserInDB object as it's missing hashed_password/id.
        # This is a consequence of the fake_db + token design limitations.

        # TEMPORARY WORKAROUND: Create a UserInDB-like object with just the username from the token
        # This will satisfy endpoints that only need the username.
        # This is fragile if endpoints try to access id or hashed_password.
        # Let's assume for now endpoints only need username. We'll add dummy ID and hashed_password.
        minimal_user_object = schemas.UserInDB(
            username=username,
            hashed_password="[NOT_LOADED_FROM_DB]", # Dummy value
            id=0 # Dummy ID as it's not in the token
        )

        # print(f"DEBUG: get_current_user returning minimal user object for: {minimal_user_object.username}") # Keep debug prints

        # We don't do a user lookup here anymore with fake_users_db or real DB.
        # The authentication happened during login; this step just validates the token.

        return minimal_user_object # Return the minimal user object derived from the token


    except JWTError as e:
        # This block catches invalid tokens (bad signature, wrong algo, expired, bad format)
        print(f"DEBUG: JWTError during decode: {e}")
        raise credentials_exception # Re-raise the authentication error


    except Exception as e:
         # Catch any other unexpected errors during token processing
         print(f"DEBUG: Unexpected error decoding token: {e}")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal token processing error")

    # REMOVE THE FAKE_USERS_DB LOOKUP SECTION
    # print(f"DEBUG: Looking up user: {token_data.username} in fake_users_db") # <--- REMOVE
    # user = next((u for u in fake_users_db if u.username == token_data.username), None) # <--- REMOVE
    # print(f"DEBUG: User lookup result: {user}") # <--- REMOVE
    # if user is None: # <--- REMOVE
    #     raise credentials_exception # <--- REMOVE
    # print(f"DEBUG: get_current_user successful for user: {user.username}") # <--- REMOVE
    # return user # <--- REMOVE