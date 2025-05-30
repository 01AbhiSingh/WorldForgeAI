from backend.models.schemas import UserInDB
from passlib.context import CryptContext # Import if you need to hash initial passwords here

# Assuming you defined pwd_context in security.py, you might need to re-create
# a simple hashing context here if you hashed the initial user passwords here.
# Or you can just keep the raw hashed passwords if they are defined like that.
# Let's assume you had hashed passwords defined directly.

# >>> CUT THIS LIST AND PASTE IT HERE FROM backend/api/auth.py <<<
fake_users_db: list[dict] = [
    # Example structure - make sure this matches what was in auth.py
    {"username": "user", "hashed_password": "$2b$12$EXAMPLEHASH...", "id": 1},
    {"username": "admin", "hashed_password": "$2b$12$ANOTHERHASH...", "id": 2},
    # Add any other fake users you had
]