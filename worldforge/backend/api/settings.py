# backend/api/settings.py

from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any

from backend.models import schemas
from backend.core.security import get_current_user # Import the dependency
from ..core.llm_providers import LLMProvider
from ..core.world_builder import WorldBuilder

from .. import constants

# --- In-Memory Storage for WorldBuilder Instances (TEMPORARY!) ---
# In a real app, the WorldBuilder state (world_data) should be in a database.
# The LLMProvider instance *could* be stored in memory per user session if it's lightweight,
# but the WorldBuilder itself holds the world data which needs persistence.
# For this demo, we'll store the WorldBuilder instance here, linked to the user.
# This dictionary will reset when the backend server restarts.
user_world_builders: Dict[str, WorldBuilder] = {}
# --- End TEMPORARY Storage ---


# Create an API router for settings/initialization
router = APIRouter()

@router.post("/init-llm", response_model=Dict[str, str]) # Return a simple success message
async def initialize_llm_provider(
    settings: schemas.LLMSettings,
    current_user: schemas.UserInDB = Depends(get_current_user) # Protect this endpoint
):
    """
    Initializes the LLM Provider and WorldBuilder instance for the current user's session.
    Requires authentication.
    """
    provider_key = settings.provider_key
    api_key = settings.api_key
    hf_model_id = settings.hf_model_id

    # Find the provider class based on the key
    provider_info = constants.PROVIDER_OPTIONS.get(provider_key)
    if provider_info is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid LLM provider key: {provider_key}"
        )

    provider_type, provider_class = provider_info

    # Validate API key presence if not mock
    if provider_type != "mock" and not api_key:
         # For HuggingFace, also require model_id here if missing, though schema handles it
        if provider_type == "huggingface" and not hf_model_id:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API Key and Hugging Face Model ID are required for {provider_key}"
            )
        elif not api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API Key is required for {provider_key}"
            )


    llm_instance = None
    try:
        # Initialize the specific provider instance
        if provider_type == "mock":
            llm_instance = MockProvider()
        elif provider_type == "huggingface":
             # Pass app_name/url for OpenRouter if needed, or remove from HF constructor
             # For simplicity here, assuming HF constructor doesn't strictly need it unless via OpenRouter
             llm_instance = provider_class(api_key=api_key, model_id=hf_model_id) # Pass model_id to HF
        else:
            llm_instance = provider_class(api_key=api_key)


        # Initialize the WorldBuilder instance with the LLM provider
        world_builder_instance = WorldBuilder(llm_instance)

        # Store the WorldBuilder instance for this user (in-memory)
        user_world_builders[current_user.username] = world_builder_instance

        return {"message": f"{provider_key} initialized and World Builder is ready for user {current_user.username}"}

    except (ImportError, ValueError) as e:
        # Catch initialization errors (e.g., bad API key, missing required lib)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, # Use 400 for client input errors
            detail=f"Failed to initialize LLM provider: {e}"
        )
    except Exception as e:
        # Catch any other unexpected errors during initialization
        print(f"Unexpected error during LLM initialization for user {current_user.username}: {e}") # Log error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred during LLM initialization: {e}"
        )

@router.get("/providers", response_model=Dict[str, str])
async def get_available_providers():
    """
    Returns a list of available LLM provider display names and keys.
    """
    providers_list = {}
    for display_name, (internal_key, _) in constants.PROVIDER_OPTIONS.items():
        providers_list[display_name] = internal_key
    return providers_list