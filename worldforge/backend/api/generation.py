# backend/api/generation.py

from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any

from backend.models import schemas
from backend.core.security import get_current_user # Import the dependency
from backend.api.settings import user_world_builders # Import the temporary storage
from backend.core.world_builder import WorldBuilder, LLMGenerationError, MissingWorldDataError, WorldBuilderError


# Create an API router for generation tasks
router = APIRouter()

@router.post("/seed", response_model=schemas.PhysicalWorldData)
async def generate_world_seed_endpoint(
    request: schemas.WorldSeedGenerateRequest,
    current_user: schemas.UserInDB = Depends(get_current_user) # Protect this endpoint
):
    """
    Generates the initial world seed (physical world details) for the current user's world.
    Requires authentication.
    Requires LLM provider to be initialized via /api/settings/init-llm first.
    """
    # Retrieve the WorldBuilder instance for the current user
    world_builder_instance = user_world_builders.get(current_user.username)

    # Check if WorldBuilder has been initialized for this user
    if not world_builder_instance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LLM provider not initialized for this user. Please initialize settings first."
        )

    core_concept = request.prompt

    try:
        # Call the generate_world_seed method from your WorldBuilder instance
        # Ensure your generate_world_seed method handles errors internally or you wrap it
        generated_data = world_builder_instance.generate_world_seed(core_concept)

        # Your generate_world_seed returns Dict[str, str], need to map it to PhysicalWorldData schema
        # It also stores data in world_builder_instance.world_data["physical_world"]
        # Let's return the data from the instance's world_data attribute after generation
        physical_world_data = world_builder_instance.world_data.get("physical_world", {})


        # Return the data, FastAPI will validate it against PhysicalWorldData schema
        return schemas.PhysicalWorldData(**physical_world_data)


    except Exception as e:
        # Catch any unexpected errors during generation
        print(f"Unexpected error during World Seed generation for user {current_user.username}: {e}") # Log error
        # Handle specific LLM errors returned as strings if needed, otherwise return generic 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred during world seed generation: {e}"
        )
@router.post("/culture", response_model=schemas.CultureData)
async def generate_cultural_tapestry_endpoint(
    request: schemas.CultureGenerateRequest,
    current_user: schemas.UserInDB = Depends(get_current_user) # Protect this endpoint
):

    # Retrieve the WorldBuilder instance for the current user
    world_builder_instance = user_world_builders.get(current_user.username)

    # Check if WorldBuilder has been initialized for this user
    if not world_builder_instance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LLM provider not initialized for this user. Please initialize settings first."
        )

    societal_structure_idea = request.societal_structure

    try:
        # Call the generate_cultural_tapestry method
        # This method will raise MissingWorldDataError if physical_world is missing
        # It will also raise LLMGenerationError or WorldBuilderError on other failures
        world_builder_instance.generate_cultural_tapestry(societal_structure_idea)

        # After successful generation, retrieve the stored culture data
        culture_data = world_builder_instance.world_data.get("culture", {})

        # Return the data, FastAPI will validate it against CultureData schema
        # Note: CultureData schema has `extra = "allow"`, so it can handle extra fields
        # or fields not explicitly listed in the schema, as long as the required ones are present.
        return schemas.CultureData(**culture_data)

    except MissingWorldDataError as e:
        # Specific error for missing prerequisite data
        print(f"ERROR during Cultural Tapestry generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, # Bad request because prerequisite is missing
            detail=f"Generation failed: {e}"
        )
    except (LLMGenerationError, WorldBuilderError) as e:
        # Catch other specific WorldBuilder errors during generation
        print(f"ERROR during Cultural Tapestry generation: {e}") # Log the specific error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, # LLM or internal WorldBuilder error
            detail=f"Generation failed: {e}"
        )
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error during Cultural Tapestry generation for user {current_user.username}: {e}") # Log error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during cultural tapestry generation."
        )
