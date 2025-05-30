import json
import time
import copy
from typing import Dict, List, Optional, Union, Any

# Import LLMProvider from the other file in the same package (core)
from .llm_providers import LLMProvider

# Define custom exceptions for clearer error handling
class WorldBuilderError(Exception):
    """Base exception for WorldBuilder errors."""
    pass

class LLMGenerationError(WorldBuilderError):
    """Exception raised when an LLM call fails or returns an error string."""
    pass

class MissingWorldDataError(WorldBuilderError):
    """Exception raised when required world data is missing for a generation step."""
    pass

class WorldFileError(WorldBuilderError):
    """Exception raised for errors during world file save/load."""
    pass


class WorldBuilder:
    """Main class for building worlds."""

    def __init__(self, llm_provider: LLMProvider):
        """Initialize the world builder with an LLM provider."""
        if not isinstance(llm_provider, LLMProvider):
            raise TypeError("llm_provider must be an instance of LLMProvider")
        self.llm = llm_provider
        self.world_data = {} # Stores all generated world info

    def save_world(self, filename: str) -> bool:
        """Save the current world data to a JSON file. Returns True on success."""
        if not filename.endswith(".json"):
            filename += ".json"
        try:
            # In a real backend, you might save to a user-specific location or a database
            # For this demo, saving to the backend server's filesystem is acceptable
            with open(filename, "w", encoding='utf-8') as f:
                json.dump(self.world_data, f, indent=2, ensure_ascii=False)
            # Replace st.success with print/logging or just return status
            print(f"INFO: World saved to `{filename}`")
            return True
        except Exception as e:
            # Replace st.error with print/logging or raise exception
            print(f"ERROR: Error saving world to {filename}: {e}")
            # Consider raising WorldFileError(f"Error saving world: {e}")
            return False

    def load_world(self, file_content: str, filename: str = "uploaded_file") -> bool:
        """Load world data from file content (received as string). Returns True on success."""
        try:
            # In a real backend, this would involve getting file content from request
            self.world_data = json.loads(file_content)
            # Replace st.success with print/logging or return status
            print(f"INFO: World loaded from `{filename}`")
            return True
        except json.JSONDecodeError:
            # Replace st.error with print/logging or raise exception
            print(f"ERROR: Invalid JSON file ({filename}). Could not load world data.")
            # Consider raising WorldFileError(f"Invalid JSON file: {filename}")
            return False
        except Exception as e:
            # Replace st.error with print/logging or raise exception
            print(f"ERROR: Error loading world from {filename}: {e}")
            # Consider raising WorldFileError(f"Error loading world: {e}")
            return False


    def _generate_category(self, category_name: str, prompt: str, data_location: List[str]) -> str:
        """Helper to generate content for a category. Returns generated text or raises exception."""
        result = None
        # Replace st.spinner with print or logging, or handle loading state in frontend
        print(f"INFO: Generating {category_name.replace('_', ' ')}...")

        try:
            result = self.llm.generate_content(prompt)

            if result and not result.startswith("Error:"):
                # Navigate dict path to store result
                current_level = self.world_data
                for key in data_location[:-1]:
                     # Create nested dicts if they don't exist
                    current_level = current_level.setdefault(key, {})
                current_level[data_location[-1]] = result
                return result # Return the generated text on success

            elif result and result.startswith("Error:"):
                # LLM returned an error string - translate to an exception
                # Replace st.error
                print(f"ERROR: LLM Error ({category_name}): {result}")
                raise LLMGenerationError(f"LLM Error ({category_name}): {result}")

            else:
                # LLM returned empty content - translate to an exception
                # Replace st.warning
                print(f"WARNING: LLM returned empty content for {category_name}.")
                raise LLMGenerationError(f"LLM returned empty content for {category_name}.")

        except Exception as e:
            # Catch any unexpected errors during generation (network, API, etc.)
            # Replace st.error
            print(f"ERROR: Unexpected error generating {category_name}: {e}")
            # Re-raise a custom exception or the original exception
            raise WorldBuilderError(f"An unexpected error occurred during {category_name} generation: {e}") from e


    # --- All generate_* methods (generate_world_seed, generate_cultural_tapestry, etc.) ---
    # Remove st.info/success/warning/error calls
    # These methods now *call* _generate_category which will raise exceptions on failure.
    # The endpoint handlers in api/generation.py should catch these exceptions.
    # The generate_* methods can still return the results dictionary.

    def generate_world_seed(self, core_concept: str) -> Dict[str, str]:
        """Generate foundational world descriptions based on a core concept."""
        # Replace st.info
        print(f"INFO: Generating World Seed based on: '{core_concept}'")

        # Decide if generate_world_seed should reset world_data or add to it.
        # Original app.py reset it here. Let's keep that logic for now.
        self.world_data = {"core_concept": core_concept}


        prompts = {
            "geography": self._create_prompt("geography", core_concept),
            "climate": self._create_prompt("climate", core_concept),
            "flora_fauna": self._create_prompt("flora_fauna", core_concept),
            "resources": self._create_prompt("resources", core_concept),
            "history": self._create_prompt("history", core_concept)
        }

        descriptions = {}
        generated_any = False # Flag to track if any category succeeded

        # The _generate_category method now raises exceptions on failure.
        # We can catch them here to prevent one failure from stopping the whole seed generation,
        # but the endpoint handler will still need to handle overall success/failure.
        # For simplicity, let's call _generate_category and rely on the endpoint to catch errors.
        # If you wanted granular error reporting per category, you'd add try/except around each call here.

        # Ensure physical_world key exists before starting
        if "physical_world" not in self.world_data:
             self.world_data["physical_world"] = {}

        # Call _generate_category for each, let exceptions propagate or catch them
        # Example catching:
        # try:
        #     generated_text = self._generate_category("geography", prompts["geography"], ["physical_world", "geography"])
        #     descriptions["geography"] = generated_text
        #     generated_any = True
        # except (LLMGenerationError, WorldBuilderError) as e:
        #      print(f"WARNING: Geography generation failed: {e}")
        #      self.world_data["physical_world"]["geography"] = f"Error: {e}" # Optional: store error message
        #      # Do NOT set generated_any = True for this category
        #
        # Repeat try/except for each category... This can get verbose.
        # A simpler approach for now: call _generate_category, it stores & raises.
        # The endpoint catches. The endpoint returns the *current* state of physical_world_data.

        # Simpler approach: Just call, let errors propagate
        try:
            self._generate_category("geography", prompts["geography"], ["physical_world", "geography"])
            self._generate_category("climate", prompts["climate"], ["physical_world", "climate"])
            # Use alias key 'flora_fauna' for storage path
            self._generate_category("flora_fauna", prompts["flora_fauna"], ["physical_world", "flora_fauna"])
            self._generate_category("resources", prompts["resources"], ["physical_world", "resources"])
            self._generate_category("history", prompts["history"], ["physical_world", "history"])
            generated_any = True # If all calls complete without raising

        except (LLMGenerationError, WorldBuilderError) as e:
             # Log that generation failed, but the endpoint will handle the final error response
             print(f"ERROR: World Seed generation failed during one category: {e}")
             # The endpoint will catch this exception and return an error response.
             # We don't need success/warning messages here anymore.
             raise e # Re-raise the caught exception so the endpoint knows it failed

        # If we reach here, all categories attempted, some might have failed silently if using granular try/except
        # but with the simpler re-raise, we only reach here if ALL succeeded.
        # Remove st.success/warning
        # if generated_any:
        #     print("INFO: World Seed generation complete!")
        # else:
        #      print("WARNING: World Seed generation finished, but some content may have failed.")

        # Return the actual generated data structure (or parts of it)
        # The endpoint will retrieve from self.world_data and format as PhysicalWorldData
        return self.world_data.get("physical_world", {})


    def generate_cultural_tapestry(self, societal_structure_idea: str) -> Dict[str, str]:
        """Generate cultural descriptions based on societal structure and world descriptions."""
        if "physical_world" not in self.world_data or not self.world_data["physical_world"]:
             # Replace st.error with raising an exception
             raise MissingWorldDataError("Physical world data (World Seed) is missing. Please generate a world seed first.")

        # Replace st.info
        print(f"INFO: Generating Cultural Tapestry for a '{societal_structure_idea}' society...")

        self.world_data["societal_structure_idea"] = societal_structure_idea

        # Provide relevant physical context to the prompts
        # Ensure robust access using .get()
        physical_world = self.world_data.get("physical_world", {})
        physical_context = f"Geography: {physical_world.get('geography', 'Not specified')}\nClimate: {physical_world.get('climate', 'Not specified')}\nResources: {physical_world.get('resources', 'Not specified')}"
        core_concept = self.world_data.get('core_concept', 'this world')

        prompts = {
            "social_structure": self._create_prompt("social_structure", societal_structure_idea, physical_context, core_concept),
            "governance": self._create_prompt("governance", societal_structure_idea, physical_context, core_concept),
            "economy": self._create_prompt("economy", societal_structure_idea, physical_context, core_concept),
            "customs": self._create_prompt("customs", societal_structure_idea, physical_context, core_concept),
            "traditions": self._create_prompt("traditions", societal_structure_idea, physical_context, core_concept),
            "religions": self._create_prompt("religions", societal_structure_idea, physical_context, core_concept),
            "language": self._create_prompt("language", societal_structure_idea, physical_context, core_concept),
            "art": self._create_prompt("art", societal_structure_idea, physical_context, core_concept),
            "technology": self._create_prompt("technology", societal_structure_idea, physical_context, core_concept)
        }

        # Ensure culture key exists before generating
        if "culture" not in self.world_data:
            self.world_data["culture"] = {}

        generated_descriptions = {} # Dictionary to hold generated text for return

        # Call _generate_category for each, catch exceptions if you want partial success,
        # or let them propagate to the endpoint handler.
        # Let's call and store if successful, let exceptions propagate on failure of any step.
        try:
            generated_descriptions["social_structure"] = self._generate_category("social_structure", prompts["social_structure"], ["culture", "social_structure"])
            generated_descriptions["governance"] = self._generate_category("governance", prompts["governance"], ["culture", "governance"])
            generated_descriptions["economy"] = self._generate_category("economy", prompts["economy"], ["culture", "economy"])
            generated_descriptions["customs"] = self._generate_category("customs", prompts["customs"], ["culture", "customs"])
            generated_descriptions["traditions"] = self._generate_category("traditions", prompts["traditions"], ["culture", "traditions"])
            generated_descriptions["religions"] = self._generate_category("religions", prompts["religions"], ["culture", "religions"])
            generated_descriptions["language"] = self._generate_category("language", prompts["language"], ["culture", "language"])
            generated_descriptions["art"] = self._generate_category("art", prompts["art"], ["culture", "art"])
            generated_descriptions["technology"] = self._generate_category("technology", prompts["technology"], ["culture", "technology"])

            # Replace st.success
            print("INFO: Cultural Tapestry generation complete!")

        except (LLMGenerationError, WorldBuilderError) as e:
            # Replace st.warning if using try/except per category, otherwise the endpoint catches
            print(f"ERROR: Cultural Tapestry generation failed during one category: {e}")
            # Re-raise the caught exception so the endpoint knows it failed
            raise e

        # Return only successfully generated descriptions for this call,
        # even though they are also stored in self.world_data
        return generated_descriptions


    def generate_faction(self, faction_name: str, faction_type: str, faction_goal: str) -> Dict[str, str]:
        """Generate a faction within the world."""
        if "culture" not in self.world_data or not self.world_data["culture"]:
            # Replace st.error
            raise MissingWorldDataError("Cultural data is missing. Please generate the cultural tapestry first.")

        # Replace st.info
        print(f"INFO: Generating Faction: '{faction_name}' ({faction_type}). Goal: {faction_goal}")

        # ... rest of generate_faction using _create_prompt and _generate_category ...
        # REMOVE ALL st. calls
        # Handle exceptions from _generate_category or let them propagate
        # Return descriptions dict

        cultural_context = f"Social Structure: {self.world_data['culture'].get('social_structure', 'Not specified')}\nGovernance: {self.world_data['culture'].get('governance', 'Not specified')}\nEconomy: {self.world_data['culture'].get('economy', 'Not specified')}\nMain Religion/Beliefs: {self.world_data['culture'].get('religions', 'Not specified')}"
        physical_context = f"Key Resources: {self.world_data.get('physical_world', {}).get('resources', 'Not specified')}\nHistorical Context: {self.world_data.get('physical_world', {}).get('history', 'Not specified')}"

        prompts = {
            "description": self._create_prompt("faction_description", faction_name, faction_type, faction_goal, cultural_context),
            "organization": self._create_prompt("faction_organization", faction_name, faction_type, faction_goal, cultural_context),
            "leadership": self._create_prompt("faction_leadership", faction_name, faction_type, faction_goal, cultural_context),
            "values_ideology": self._create_prompt("faction_values", faction_name, faction_type, faction_goal, cultural_context),
            "activities_methods": self._create_prompt("faction_activities", faction_name, faction_type, faction_goal, cultural_context),
            "relationships": self._create_prompt("faction_relationships", faction_name, faction_type, faction_goal, self.world_data.get("factions", {})), # Pass existing factions for context
            "resources_assets": self._create_prompt("faction_resources", faction_name, faction_type, faction_goal, physical_context),
            "history_origin": self._create_prompt("faction_history", faction_name, faction_type, faction_goal, physical_context)
        }

        descriptions = {}
        faction_data_base_path = ["factions", faction_name]

        if "factions" not in self.world_data:
            self.world_data["factions"] = {}

        # Prepare the structure for the new faction data
        # This mirrors the structure you had for storing faction data
        new_faction_data = {
            "type": faction_type,
            "goal": faction_goal,
            "details": {}
        }
        # Store this partial data immediately, details will be filled by _generate_category
        self.world_data["factions"][faction_name] = new_faction_data


        # Call _generate_category for each, let exceptions propagate or catch them
        try:
            descriptions["description"] = self._generate_category("faction description", prompts["faction_description"], faction_data_base_path + ["details", "description"])
            descriptions["organization"] = self._generate_category("faction organization", prompts["faction_organization"], faction_data_base_path + ["details", "organization"])
            descriptions["leadership"] = self._generate_category("faction leadership", prompts["faction_leadership"], faction_data_base_path + ["details", "leadership"])
            descriptions["values_ideology"] = self._generate_category("faction values_ideology", prompts["faction_values"], faction_data_base_path + ["details", "values_ideology"])
            descriptions["activities_methods"] = self._generate_category("faction activities_methods", prompts["faction_activities"], faction_data_base_path + ["details", "activities_methods"])
            descriptions["relationships"] = self._generate_category("faction relationships", prompts["faction_relationships"], faction_data_base_path + ["details", "relationships"])
            descriptions["resources_assets"] = self._generate_category("faction resources_assets", prompts["faction_resources"], faction_data_base_path + ["details", "resources_assets"])
            descriptions["history_origin"] = self._generate_category("faction history_origin", prompts["faction_history"], faction_data_base_path + ["details", "history_origin"])

            # Replace st.success
            print(f"INFO: Faction '{faction_name}' generation complete!")

        except (LLMGenerationError, WorldBuilderError) as e:
            # Replace st.warning/error
            print(f"ERROR: Faction '{faction_name}' generation failed during one category: {e}")
            # Decide how to handle partial failure:
            # 1. Remove the partially created faction? del self.world_data["factions"][faction_name]
            # 2. Keep the partial data and return it?
            # 3. Re-raise the exception? Yes, re-raise so the endpoint knows it failed.
            raise e

        return descriptions


    def generate_character(self, character_name: str, character_role: str, ethnicity: str, faction_name: Optional[str] = None, character_quirk: str = "") -> Dict[str, str]:
        """Generate a character description based on role, ethnicity, optional faction, and quirk."""
        if "culture" not in self.world_data or not self.world_data["culture"]:
            # Replace st.error
            raise MissingWorldDataError("Cultural data is missing. Please generate the cultural tapestry first.")

        # Replace st.info
        print(f"INFO: Generating Character: '{character_name}' ({ethnicity} {character_role}). Quirk: {character_quirk or 'None'}")

        # ... rest of generate_character using _create_prompt and _generate_category ...
        # REMOVE ALL st. calls
        # Handle exceptions from _generate_category or let them propagate
        # Return descriptions dict

        cultural_context = f"Culture ({ethnicity}): {self.world_data['culture'].get('customs', 'General customs apply.')} Traditions: {self.world_data['culture'].get('traditions', 'General traditions apply.')} Language hints: {self.world_data['culture'].get('language', 'Common tongue assumed.')}"
        physical_context = f"Environment: {self.world_data.get('physical_world', {}).get('geography', 'Varied.')} Climate: {self.world_data.get('physical_world', {}).get('climate', 'Varied.')}"
        faction_context = ""
        # Ensure safe access using .get() and handle None faction_name
        if faction_name and faction_name in self.world_data.get("factions", {}):
            faction_data = self.world_data["factions"].get(faction_name, {}) # Use .get for safety
            faction_context = f"Affiliated Faction '{faction_name}': Type - {faction_data.get('type')}, Goal - {faction_data.get('goal')}, Values - {faction_data.get('details',{}).get('values_ideology', 'Not specified.')}"
        else:
            faction_name = None # Ensure faction_name is None if not found or provided

        # Adjusted prompts dict to potentially align better with prompt template args based on your _create_prompt
        prompts = {
            # 0=name, 1=role, 2=ethnicity, 3=context1, [4=context2], [5=context3], ...
            "appearance": self._create_prompt("character_appearance", character_name, character_role, ethnicity, physical_context, character_quirk),
            "personality": self._create_prompt("character_personality", character_name, character_role, ethnicity, cultural_context, character_quirk),
            "backstory": self._create_prompt("character_backstory", character_name, character_role, ethnicity, faction_context, cultural_context, character_quirk), # Requires 6 args? name, role, ethnicity, fact, cult, quirk
            "skills_abilities": self._create_prompt("character_skills", character_name, character_role, ethnicity, faction_context, character_quirk), # Requires 5 args? name, role, ethnicity, fact, quirk
            "relationships": self._create_prompt("character_relationships", character_name, character_role, ethnicity, faction_context, self.world_data.get("characters", {})), # Requires 5 args? name, role, ethnicity, fact, existing_chars
            "aspirations_motivations": self._create_prompt("character_aspirations", character_name, character_role, ethnicity, faction_context, character_quirk), # Requires 5 args? name, role, ethnicity, fact, quirk
            "possessions_equipment": self._create_prompt("character_possessions", character_name, character_role, ethnicity, cultural_context) # Requires 4 args? name, role, ethnicity, cult
        }

        descriptions = {}
        char_data_base_path = ["characters", character_name]

        if "characters" not in self.world_data:
            self.world_data["characters"] = {}

        # Prepare the structure for the new character data
        new_character_data = {
            "role": character_role,
            "ethnicity": ethnicity,
            "faction": faction_name,
            "quirk": character_quirk,
            "details": {}
        }
        # Store this partial data immediately
        self.world_data["characters"][character_name] = new_character_data


        # Call _generate_category for each, let exceptions propagate or catch them
        try:
            # Ensure category names passed to _generate_category match where you want data stored
            descriptions["appearance"] = self._generate_category("character appearance", prompts["appearance"], char_data_base_path + ["details", "appearance"])
            descriptions["personality"] = self._generate_category("character personality", prompts["personality"], char_data_base_path + ["details", "personality"])
            descriptions["backstory"] = self._generate_category("character backstory", prompts["backstory"], char_data_base_path + ["details", "backstory"])
            descriptions["skills_abilities"] = self._generate_category("character skills_abilities", prompts["skills_abilities"], char_data_base_path + ["details", "skills_abilities"])
            descriptions["relationships"] = self._generate_category("character relationships", prompts["relationships"], char_data_base_path + ["details", "relationships"])
            descriptions["aspirations_motivations"] = self._generate_category("character aspirations_motivations", prompts["aspirations_motivations"], char_data_base_path + ["details", "aspirations_motivations"])
            descriptions["possessions_equipment"] = self._generate_category("character possessions_equipment", prompts["possessions_equipment"], char_data_base_path + ["details", "possessions_equipment"])

            # Replace st.success
            print(f"INFO: Character '{character_name}' generation complete!")

        except (LLMGenerationError, WorldBuilderError) as e:
            # Replace st.warning/error
            print(f"ERROR: Character '{character_name}' generation failed during one category: {e}")
            # Decide how to handle partial failure: remove or re-raise
            # raise e # Re-raise the exception

        return descriptions


    def generate_location(self, location_name: str, location_type: str, location_description_brief: str) -> Dict[str, str]:
        """Generate a specific location within the world."""
        if "physical_world" not in self.world_data or not self.world_data["physical_world"]:
            # Replace st.error
            raise MissingWorldDataError("Physical world data (World Seed) is missing. Please generate a world seed first.")

        # Replace st.info
        print(f"INFO: Generating Location: '{location_name}' ({location_type}). Description: {location_description_brief}")

        # ... rest of generate_location using _create_prompt and _generate_category ...
        # REMOVE ALL st. calls
        # Handle exceptions from _generate_category or let them propagate
        # Return descriptions dict

        physical_world = self.world_data.get("physical_world", {})
        cultural_world = self.world_data.get("culture", {}) # Use .get() for safety

        physical_context = f"General Geography: {physical_world.get('geography', 'Not specified')}\nGeneral Climate: {physical_world.get('climate', 'Not specified')}"
        cultural_context = f"Dominant Culture(s): {cultural_world.get('social_structure', 'Not specified')} Governance Style: {cultural_world.get('governance', 'Not specified')}"
        historical_context = f"World History Overview: {physical_world.get('history', 'Not specified')}"


        prompts = {
            "detailed_description": self._create_prompt("location_description", location_name, location_type, location_description_brief, physical_context),
            "history": self._create_prompt("location_history", location_name, location_type, location_description_brief, historical_context),
            "inhabitants_demographics": self._create_prompt("location_inhabitants", location_name, location_type, location_description_brief, cultural_context),
            "points_of_interest": self._create_prompt("location_poi", location_name, location_type, location_description_brief),
            "economy_trade": self._create_prompt("location_economy", location_name, location_type, location_description_brief, cultural_context),
            "governance_law": self._create_prompt("location_governance", location_name, location_type, location_description_brief, cultural_context),
            "culture_customs": self._create_prompt("location_culture", location_name, location_type, location_description_brief, cultural_context),
            "secrets_rumors": self._create_prompt("location_secrets", location_name, location_type, location_description_brief)
        }

        descriptions = {}
        loc_data_base_path = ["locations", location_name]

        if "locations" not in self.world_data:
            self.world_data["locations"] = {}
        self.world_data["locations"][location_name] = {
            "type": location_type,
            "brief": location_description_brief,
            "details": {}
        }

        # Call _generate_category for each, let exceptions propagate or catch them
        try:
            descriptions["detailed_description"] = self._generate_category("location detailed_description", prompts["detailed_description"], loc_data_base_path + ["details", "detailed_description"])
            descriptions["history"] = self._generate_category("location history", prompts["history"], loc_data_base_path + ["details", "history"])
            descriptions["inhabitants_demographics"] = self._generate_category("location inhabitants_demographics", prompts["inhabitants_demographics"], loc_data_base_path + ["details", "inhabitants_demographics"])
            descriptions["points_of_interest"] = self._generate_category("location points_of_interest", prompts["points_of_interest"], loc_data_base_path + ["details", "points_of_interest"])
            descriptions["economy_trade"] = self._generate_category("location economy_trade", prompts["economy_trade"], loc_data_base_path + ["details", "economy_trade"])
            descriptions["governance_law"] = self._generate_category("location governance_law", prompts["governance_law"], loc_data_base_path + ["details", "governance_law"])
            descriptions["culture_customs"] = self._generate_category("location culture_customs", prompts["culture_customs"], loc_data_base_path + ["details", "culture_customs"])
            descriptions["secrets_rumors"] = self._generate_category("location secrets_rumors", prompts["secrets_rumors"], loc_data_base_path + ["details", "secrets_rumors"])

            # Replace st.success
            print(f"INFO: Location '{location_name}' generation complete!")

        except (LLMGenerationError, WorldBuilderError) as e:
            # Replace st.warning/error
            print(f"ERROR: Location '{location_name}' generation failed during one category: {e}")
            # Decide how to handle partial failure: remove or re-raise
            # raise e # Re-raise the exception

        return descriptions


    def generate_artifact(self, artifact_name: str, artifact_type: str, artifact_origin: str) -> Dict[str, str]:
        """Generate a legendary artifact or important item in the world."""
        # Replace st.info
        print(f"INFO: Generating Artifact: '{artifact_name}' ({artifact_type}). Origin: {artifact_origin}")

        # ... rest of generate_artifact using _create_prompt and _generate_category ...
        # REMOVE ALL st. calls
        # Handle exceptions from _generate_category or let them propagate
        # Return descriptions dict

        physical_world = self.world_data.get("physical_world", {}) # Use .get() for safety
        cultural_world = self.world_data.get("culture", {}) # Use .get() for safety

        historical_context = f"World History Overview: {physical_world.get('history', 'Not specified')}"
        cultural_context = f"Relevant Cultures: {cultural_world.get('religions', 'Various beliefs exist.')}"


        prompts = {
            "description_appearance": self._create_prompt("artifact_description", artifact_name, artifact_type, artifact_origin),
            "history_legend": self._create_prompt("artifact_history", artifact_name, artifact_type, artifact_origin, historical_context),
            "powers_abilities": self._create_prompt("artifact_powers", artifact_name, artifact_type, artifact_origin),
            "creation_maker": self._create_prompt("artifact_creation", artifact_name, artifact_type, artifact_origin),
            "current_status_location": self._create_prompt("artifact_status", artifact_name, artifact_type, artifact_origin),
            "cultural_significance": self._create_prompt("artifact_significance", artifact_name, artifact_type, artifact_origin, cultural_context)
        }

        descriptions = {}
        art_data_base_path = ["artifacts", artifact_name]

        if "artifacts" not in self.world_data:
            self.world_data["artifacts"] = {}
        self.world_data["artifacts"][artifact_name] = {
            "type": artifact_type,
            "origin": artifact_origin,
            "details": {}
        }

        # Call _generate_category for each, let exceptions propagate or catch them
        try:
            descriptions["description_appearance"] = self._generate_category("artifact description_appearance", prompts["description_appearance"], art_data_base_path + ["details", "description_appearance"])
            descriptions["history_legend"] = self._generate_category("artifact history_legend", prompts["history_legend"], art_data_base_path + ["details", "history_legend"])
            descriptions["powers_abilities"] = self._generate_category("artifact powers_abilities", prompts["powers_abilities"], art_data_base_path + ["details", "powers_abilities"])
            descriptions["creation_maker"] = self._generate_category("artifact creation_maker", prompts["creation_maker"], art_data_base_path + ["details", "creation_maker"])
            descriptions["current_status_location"] = self._generate_category("artifact current_status_location", prompts["current_status_location"], art_data_base_path + ["details", "current_status_location"])
            descriptions["cultural_significance"] = self._generate_category("artifact cultural_significance", prompts["cultural_significance"], art_data_base_path + ["details", "cultural_significance"])

            # Replace st.success
            print(f"INFO: Artifact '{artifact_name}' generation complete!")

        except (LLMGenerationError, WorldBuilderError) as e:
            # Replace st.warning/error
            print(f"ERROR: Artifact '{artifact_name}' generation failed during one category: {e}")
            # Decide how to handle partial failure: remove or re-raise
            # raise e # Re-raise the exception

        return descriptions


    def generate_event(self, event_name: str, event_type: str, event_timeframe: str) -> Dict[str, str]:
        """Generate a historical or current event in the world."""
        # Replace st.info
        print(f"INFO: Generating Event: '{event_name}' ({event_type}). Timeframe: {event_timeframe}")

        # ... rest of generate_event using _create_prompt and _generate_category ...
        # REMOVE ALL st. calls
        # Handle exceptions from _generate_category or let them propagate
        # Return descriptions dict

        physical_world = self.world_data.get("physical_world", {}) # Use .get() for safety
        factions_world = self.world_data.get("factions", {}) # Use .get() for safety
        characters_world = self.world_data.get("characters", {}) # Use .get() for safety


        historical_context = f"World History Overview: {physical_world.get('history', 'Not specified')}"
        faction_context = f"Existing Factions: {list(factions_world.keys())}"
        character_context = f"Notable Character Roles: {[c.get('role') for c in characters_world.values() if isinstance(c, dict) and c.get('role')]}" # Ensure c is dict and has role


        prompts = {
            "summary_description": self._create_prompt("event_description", event_name, event_type, event_timeframe),
            "causes_triggers": self._create_prompt("event_causes", event_name, event_type, event_timeframe, historical_context),
            "major_happenings": self._create_prompt("event_happenings", event_name, event_type, event_timeframe),
            "key_figures_groups": self._create_prompt("event_figures", event_name, event_type, event_timeframe, faction_context, character_context),
            "outcome_impact": self._create_prompt("event_impact", event_name, event_type, event_timeframe, historical_context),
            "long_term_consequences": self._create_prompt("event_consequences", event_name, event_type, event_timeframe, historical_context)
        }

        descriptions = {}
        event_data_base_path = ["events", event_name]

        if "events" not in self.world_data:
            self.world_data["events"] = {}
        self.world_data["events"][event_name] = {
            "type": event_type,
            "timeframe": event_timeframe,
            "details": {}
        }


        # Call _generate_category for each, let exceptions propagate or catch them
        try:
            descriptions["summary_description"] = self._generate_category("event summary_description", prompts["summary_description"], event_data_base_path + ["details", "summary_description"])
            descriptions["causes_triggers"] = self._generate_category("event causes_triggers", prompts["causes_triggers"], event_data_base_path + ["details", "causes_triggers"])
            descriptions["major_happenings"] = self._generate_category("event major_happenings", prompts["major_happenings"], event_data_base_path + ["details", "major_happenings"])
            descriptions["key_figures_groups"] = self._generate_category("event key_figures_groups", prompts["key_figures_groups"], event_data_base_path + ["details", "key_figures_groups"])
            descriptions["outcome_impact"] = self._generate_category("event outcome_impact", prompts["outcome_impact"], event_data_base_path + ["details", "outcome_impact"])
            descriptions["long_term_consequences"] = self._generate_category("event long_term_consequences", prompts["long_term_consequences"], event_data_base_path + ["details", "long_term_consequences"])

            # Replace st.success
            print(f"INFO: Event '{event_name}' generation complete!")

        except (LLMGenerationError, WorldBuilderError) as e:
            # Replace st.warning/error
            print(f"ERROR: Event '{event_name}' generation failed during one category: {e}")
            # Decide how to handle partial failure: remove or re-raise
            # raise e # Re-raise the exception

        return descriptions


    def simulate_interaction(self, entity1_name: str, entity2_name: str, interaction_type: str, setting_context: str) -> str:
        """Simulate an interaction between two entities (characters, factions, etc.). Returns the simulation text."""
        entity1_data = self._find_entity(entity1_name)
        entity2_data = self._find_entity(entity2_name)

        if not entity1_data or not entity2_data:
            missing = []
            if not entity1_data: missing.append(entity1_name)
            if not entity2_data: missing.append(entity2_name)
            # Replace st.error
            raise MissingWorldDataError(f"Entity data not found for: {', '.join(missing)}. Please ensure they have been generated.")

        def summarize_entity(name, data):
            # Improved summary logic
            summary_parts = []
            entity_type = data.get('type', data.get('role', 'Unknown')) # Faction type or Character role
            summary_parts.append(f"Entity: {name} ({entity_type})")
            details = data.get('details', {})
            if 'values_ideology' in details: summary_parts.append(f"Values/Ideology: {details['values_ideology'][:150]}...") # Faction
            if 'personality' in details: summary_parts.append(f"Personality: {details['personality'][:150]}...") # Character
            if 'aspirations_motivations' in details: summary_parts.append(f"Aspirations: {details['aspirations_motivations'][:150]}...") # Character
            if 'goal' in data: summary_parts.append(f"Goal: {data['goal']}") # Faction goal
            return "\n".join(summary_parts)


        entity1_summary = summarize_entity(entity1_name, entity1_data)
        entity2_summary = summarize_entity(entity2_name, entity2_data)

        prompt = f"""You are a master storyteller simulating interactions in a fantasy world.
World Context: Core Concept - {self.world_data.get('core_concept', 'N/A')}. Recent History - {self.world_data.get('physical_world', {}).get('history', 'N/A')[:200]}...

Entities Involved:
{entity1_summary}

{entity2_summary}

Interaction Scenario:
Simulate a '{interaction_type}' interaction between {entity1_name} and {entity2_name}.
Setting/Context: {setting_context}

Task:
Write a detailed narrative of this interaction. Include:
- Plausible dialogue reflecting their personalities, goals, and relationship (if any).
- Key actions and decisions made by each entity.
- The immediate outcome of the interaction.
- Potential short-term consequences or future implications for both entities and their surroundings.
Maintain consistency with the provided entity summaries and world context. Be creative and engaging.
"""

        result = ""
        # Replace st.spinner
        print(f"INFO: Simulating '{interaction_type}' between {entity1_name} and {entity2_name}...")

        try:
            result = self.llm.generate_content(prompt)

            if result and not result.startswith("Error:"):
                # Save interaction to world data (in-memory)
                if "interactions" not in self.world_data:
                    self.world_data["interactions"] = []
                # Insert newest first for easier display later
                self.world_data["interactions"].insert(0, {
                    "entities": [entity1_name, entity2_name],
                    "type": interaction_type,
                    "setting": setting_context,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "result": result
                })
                # Replace st.success
                print("INFO: Interaction simulation complete!")
                return result # Return the generated text

            elif result: # Handle LLM error string
                # Replace st.error
                print(f"ERROR: LLM Error during simulation: {result}")
                # Raise an exception instead of returning an error string
                raise LLMGenerationError(f"LLM Error during simulation: {result}")

            else:
                # Replace st.warning
                print("WARNING: Simulation returned empty content.")
                # Raise an exception for empty content
                raise LLMGenerationError("Simulation returned empty content.")


        except (LLMGenerationError, WorldBuilderError) as e:
             # Replace st.error
             print(f"ERROR: Unexpected error simulating interaction: {e}")
             # Re-raise the caught exception
             raise e


    # --- _find_entity, get_all_entity_names, _create_prompt ---
    # Keep these helper methods, but remove any st. calls if they had any (they didn't in the provided code)
    def _find_entity(self, entity_name: str) -> Optional[Dict]:
        """Find an entity (character, faction, location) in the world data by name."""
        # Use .get with default empty dict to simplify checks
        # This method does not use st. calls, so it's fine as is.
        character_data = self.world_data.get("characters", {}).get(entity_name)
        if character_data:
            return copy.deepcopy(character_data)

        faction_data = self.world_data.get("factions", {}).get(entity_name)
        if faction_data:
            return copy.deepcopy(faction_data)

        location_data = self.world_data.get("locations", {}).get(entity_name)
        if location_data:
             return copy.deepcopy(location_data)

        return None # Return None if not found

    def get_all_entity_names(self) -> List[str]:
        """Returns a list of names for all generated characters and factions."""
         # This method does not use st. calls, so it's fine as is.
        char_names = list(self.world_data.get("characters", {}).keys())
        faction_names = list(self.world_data.get("factions", {}).keys())
        names = char_names + faction_names
        return sorted(list(set(names))) # Sort and remove duplicates


    def _create_prompt(self, prompt_type: str, *args) -> str:
        """Create a detailed prompt based on the type and arguments, incorporating world context."""
        # This method does not use st. calls (only print for warnings), so it's fine as is.
        # Ensure print statements are acceptable backend logging or replace with 'logging' module.
        # For now, print is okay for development.

        world_context_summary = f"World Core Concept: {self.world_data.get('core_concept', 'Not specified')}. "
        physical_data = self.world_data.get('physical_world', {})
        culture_data = self.world_data.get('culture', {})

        if physical_data:
            geo = physical_data.get('geography', '')
            clim = physical_data.get('climate', '')
            hist = physical_data.get('history', '')
            world_context_summary += f"Key Geography: {geo[:100]}... Climate: {clim[:100]}... History Snippet: {hist[:100]}..."
        if culture_data:
            soc = culture_data.get('social_structure', '')
            gov = culture_data.get('governance', '')
            world_context_summary += f" Dominant Culture: {soc[:100]}... Governance: {gov[:100]}..."

        world_context_summary = world_context_summary[:500] + "..." if len(world_context_summary) > 500 else world_context_summary

        base_prompt_templates = {
            # --- World seed prompts (expect 1 arg: core_concept) ---
            "geography": "(give 2 word reply)You are a fantasy world-building expert... Based on the core concept '{0}', describe...",
            "climate": "(give 2 word reply)You are a fantasy world-building expert... For a world based on '{0}', describe its climate patterns...",
            "flora_fauna": "(give 2 word reply)You are a fantasy world-building expert... Invent unique flora and fauna for a world based on '{0}'...",
            "resources": "(give 2 word reply)You are a fantasy world-building expert... Describe the key natural resources found in a world based on '{0}'...",
            "history": "(give 2 word reply)You are a fantasy world-building expert... Create a concise history outline for a world based on '{0}'...",

            # --- Cultural tapestry prompts (expect 3 args: idea, physical_ctx, core_concept) ---
            "social_structure": "(give 2 word reply)You are a fantasy world-building expert... Detail the social structure of a '{0}' society within the world context '{2}'. Physical Context: {1}. Describe...",
            "governance": "(give 2 word reply)You are a fantasy world-building expert... Describe the governance... of a '{0}' society within the world context '{2}'. Physical Context: {1}. Explain...",
            "economy": "(give 2 word reply)You are a fantasy world-building expert... Describe the economy of a '{0}' society within the world context '{2}'. Physical Context: {1}. Explain...",
            "customs": "(give 2 word reply)You are a fantasy world-building expert... Describe the daily customs... of a '{0}' society within the world context '{2}'. Physical Context: {1}. Include...",
            "traditions": "(give 2 word reply)You are a fantasy world-building expert... Detail the significant traditions... of a '{0}' society within the world context '{2}'. Physical Context: {1}. Describe...",
            "religions": "(give 2 word reply)You are a fantasy world-building expert... Describe the primary religious beliefs... of a '{0}' society within the world context '{2}'. Physical Context: {1}. Detail...",
            "language": "(give 2 word reply)You are a fantasy world-building expert... Create key aspects of the language(s) for a '{0}' society within the world context '{2}'. Physical Context: {1}. Suggest...",
            "art": "(give 2 word reply)You are a fantasy world-building expert... Describe the prominent artistic expressions of a '{0}' society within the world context '{2}'. Physical Context: {1}. Detail...",
            "technology": "(give 2 word reply)You are a fantasy world-building expert... Describe the general technology level... of a '{0}' society within the world context '{2}'. Physical Context: {1}. Consider...",

            # --- Faction prompts (expect varying args, check calls carefully) ---
            # 0=name, 1=type, 2=goal, 3=cultural_ctx, [4=physical_ctx], [5=existing_factions]
            "faction_description": "(give 2 word reply)You are a fantasy world-building expert. Describe the faction '{0}', a '{1}' group whose main goal is '{2}'. ... Cultural Context: {3}. {world_context_summary}",
            "faction_organization": "(give 2 word reply)Detail the internal organization... of the faction '{0}' (a '{1}' aiming for '{2}'). ... Cultural Context: {3}. {world_context_summary}",
            "faction_leadership": "(give 2 word reply)Describe the leadership... of the faction '{0}' (a '{1}' aiming for '{2}'). ... Cultural Context: {3}. {world_context_summary}",
            "faction_values": "(give 2 word reply)Explain the core values... of the faction '{0}' (a '{1}' aiming for '{2}'). ... Cultural Context: {3}. {world_context_summary}",
            "faction_activities": "(give 2 word reply)Describe the typical activities... of the faction '{0}' (a '{1}' aiming for '{2}'). ... Cultural Context: {3}. {world_context_summary}",
            "faction_relationships": "(give 2 word reply)Detail the relationships of the faction '{0}' (a '{1}' aiming for '{2}') with other groups. ... Consider other factions {4}. {world_context_summary}", # Arg index 4 is factions dict
            "faction_resources": "(give 2 word reply)Describe the resources... for the faction '{0}' (a '{1}' aiming for '{2}'). ... Physical/Resource Context: {4}. {world_context_summary}", # Arg index 4 is physical_ctx
            "faction_history": "(give 2 word reply)Outline the history... of the faction '{0}' (a '{1}' aiming for '{2}'). ... Historical Context: {4}. {world_context_summary}", # Arg index 4 is physical_ctx

            # --- Character prompts (expect varying args) ---
            # 0=name, 1=role, 2=ethnicity, 3=context1, [4=context2], [5=context3], ...
            "character_appearance": "(give 2 word reply)You are a fantasy world-building expert... Describe the physical appearance of '{0}', a '{2}' '{1}'. Consider their {3}. Quirk Influence: {4}. {world_context_summary}", # Expects 5 args
            "character_personality": "(give 2 word reply)You are a fantasy world-building expert... Describe the personality of '{0}', a '{2}' '{1}'. Consider their {3}. Quirk Influence: {4}. {world_context_summary}", # Expects 5 args
            "character_backstory": "(give 2 word reply)You are a fantasy world-building expert... Create a compelling backstory for '{0}', a '{2}' '{1}'. Consider their {3} and {4}. Quirk Origin/Influence: {5}. {world_context_summary}", # Expects 6 args
            "character_skills": "(give 2 word reply)You are a fantasy world-building expert... Detail the skills... of '{0}', a '{2}' '{1}'. Consider their {3}. Quirk Influence: {4}. {world_context_summary}", # Expects 5 args
            "character_relationships": "(give 2 word reply)You are a fantasy world-building expert... Describe the key relationships of '{0}', a '{2}' '{1}'. Consider their {3} and existing characters like {4}. {world_context_summary}", # Expects 5 args
            "character_aspirations": "(give 2 word reply)You are a fantasy world-building expert... Detail the aspirations... of '{0}', a '{2}' '{1}'. Consider their {3}. Quirk Influence: {4}. {world_context_summary}", # Expects 5 args
            "character_possessions": "(give 2 word reply)You are a fantasy world-building expert... Describe the significant possessions... of '{0}', a '{2}' '{1}'. Consider their {3}. {world_context_summary}", # Expects 4 args

            # --- Location prompts (expect varying args) ---
            # 0=name, 1=type, 2=brief_desc, 3=context
            "location_description": "(give 2 word reply)You are a fantasy world-building expert... Provide a detailed sensory description of '{0}', a '{1}' described as: '{2}'. Physical Context: {3}. {world_context_summary}", # Expects 4 args
            "location_history": "(give 2 word reply)Outline the history of '{0}', a '{1}' ({2}). Historical Context: {3}. {world_context_summary}", # Expects 4 args
            "location_inhabitants": "(give 2 word reply)Describe the typical inhabitants... of '{0}', a '{1}' ({2}). Cultural Context: {3}. {world_context_summary}", # Expects 4 args
            "location_poi": "(give 2 word reply)Detail 3-5 specific points of interest within '{0}', a '{1}' ({2}).", # Expects 3 args
            "location_economy": "(give 2 word reply)Describe the local economy... within '{0}', a '{1}' ({2}). Cultural Context: {3}. {world_context_summary}", # Expects 4 args
            "location_governance": "(give 2 word reply)Explain the local governance... within '{0}', a '{1}' ({2}). Cultural Context: {3}. {world_context_summary}", # Expects 4 args
            "location_culture": "(give 2 word reply)Describe the unique local culture... in '{0}', a '{1}' ({2}). Cultural Context: {3}. {world_context_summary}", # Expects 4 args
            "location_secrets": "(give 2 word reply)Invent some secrets... associated with '{0}', a '{1}' ({2}).", # Expects 3 args

            # --- Artifact prompts (expect varying args) ---
            # 0=name, 1=type, 2=origin, [3=context]
            "artifact_description": "(give 2 word reply)You are a fantasy world-building expert. Describe the appearance... of '{0}', a '{1}' artifact supposedly originating from '{2}'. {world_context_summary}", # Expects 3 args
            "artifact_history": "(give 2 word reply)Detail the known history... surrounding '{0}', a '{1}' from '{2}'. Historical Context: {3}. {world_context_summary}", # Expects 4 args
            "artifact_powers": "(give 2 word reply)Describe the powers... of '{0}', a '{1}' from '{2}'.", # Expects 3 args
            "artifact_creation": "(give 2 word reply)Elaborate on the creation of '{0}', a '{1]}' from '{2}'.", # Expects 3 args
            "artifact_status": "(give 2 word reply)Describe the current status... of '{0}', a '{1}' from '{2}'.", # Expects 3 args
            "artifact_significance": "(give 2 word reply)Explain the cultural... significance of '{0}', a '{1}' from '{2}'. Cultural Context: {3}. {world_context_summary}", # Expects 4 args

            # --- Event prompts (expect varying args) ---
            # 0=name, 1=type, 2=timeframe, [3=context], [4=context]
            "event_description": "(give 2 word reply)You are a fantasy world-building historian. Provide a concise summary description of '{0}', a '{1]}' event that occurred roughly '{2}'. {world_context_summary}", # Expects 3 args
            "event_causes": "(give 2 word reply)Detail the primary causes... leading up to '{0}', a '{1}' ({2}). Historical Context: {3}. {world_context_summary}", # Expects 4 args
            "event_happenings": "(give 2 word reply)Describe the major happenings... during '{0}', a '{1}' ({2}).", # Expects 3 args
            "event_figures": "I(give 2 word reply)dentify the key figures... involved in '{0}', a '{1}' ({2}). Context: {3}, {4}. {world_context_summary}", # Expects 5 args
            "event_impact": "(give 2 word reply)Describe the immediate outcome... of '{0}', a '{1}' ({2}). Historical Context: {3}. {world_context_summary}", # Expects 4 args
            "event_consequences": "(give 2 word reply)Explain the long-term consequences... of '{0}', a '{1}' ({2}). Historical Context: {3}. {world_context_summary}", # Expects 4 args
        }

        template = base_prompt_templates.get(prompt_type)

        if template is None:
            fallback_args = ", ".join(map(str, args))
            # Replace print with logging or return a specific error value/structure
            print(f"Warning: Unknown prompt type '{prompt_type}' requested.")
            return f"Generate detailed information about '{prompt_type.replace('_', ' ')}' concerning '{fallback_args}'. Consider the overall world context: {world_context_summary}"

        try:
            return template.format(*args)
        except IndexError:
            # Replace print with logging or return a specific error value/structure
            num_expected = template.count('{') # Simple approximation
            num_provided = len(args)
            fallback_args = ", ".join(map(str, args))
            print(f"Warning: Prompt '{prompt_type}' called with incorrect number of arguments (provided {num_provided}, template might expect approx {num_expected}). Args: {args}. Using fallback.")
            return f"Error creating prompt '{prompt_type}': Mismatched arguments. Base info: '{fallback_args}'. World context: {world_context_summary}"
        except Exception as e:
            # Replace print with logging or return a specific error value/structure
            fallback_args = ", ".join(map(str, args))
            print(f"Error formatting prompt '{prompt_type}' with args {args}: {e}")
            return f"Error formatting prompt '{prompt_type}'. Base info: '{fallback_args}'. World context: {world_context_summary}"