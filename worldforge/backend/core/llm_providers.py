# llm_providers.py
# llm_providers.py
#import streamlit as st
import time
import json
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Union, Any

# LLM Provider Base Class
class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def generate_content(self, prompt: str) -> str:
        """Generate content based on the provided prompt."""
        pass

    @abstractmethod
    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get a response from a chat-based interaction."""
        pass

# DeepSeek via OpenRouter Implementation
class DeepSeekProvider(LLMProvider):
    """DeepSeek API provider implementation using OpenRouter."""

    def __init__(self, api_key: str, app_name: str = "AI Agent", app_url: str = "https://example.com"):
        """Initialize the DeepSeek provider with OpenRouter API key."""
        try:
            import openai
            self.client = openai.OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
                default_headers={
                    "HTTP-Referer": app_url,
                    "X-Title": app_name
                }
            )
            self.model = "deepseek/deepseek-r1:free"  # or "deepseek-coder" for coding tasks
        except ImportError:
            raise ImportError("openai library not found. Please install it: pip install openai")
        except Exception as e:
            raise ValueError(f"Failed to initialize DeepSeek via OpenRouter: {e}")

    def generate_content(self, prompt: str) -> str:
        """Generate content using DeepSeek."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            if response.choices:
                return response.choices[0].message.content
            return "Error: DeepSeek returned no choices."
        except Exception as e:
            return f"Error generating content with DeepSeek: {e}"

    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get a chat response from DeepSeek."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            if response.choices:
                return response.choices[0].message.content
            return "Error: DeepSeek returned no choices for chat."
        except Exception as e:
            return f"Error getting chat response from DeepSeek: {e}"
# Google Gemini Implementation
class GeminiProvider(LLMProvider):
    """Google Gemini API provider implementation."""

    def __init__(self, api_key: str):
        """Initialize the Gemini provider with API key."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        except ImportError:
            # Raise error instead of using st.error directly in backend code
            raise ImportError("google-generativeai library not found. Please install it: pip install google-generativeai")
        except Exception as e:
            raise ValueError(f"Failed to initialize Gemini: {e}")


    def generate_content(self, prompt: str) -> str:
        """Generate content using Gemini."""
        try:
            response = self.model.generate_content(prompt)
            # Add basic safety check
            if not response.parts:
                 return f"Gemini returned no content. Prompt: '{prompt[:100]}...'. Check safety settings or prompt."
            return response.text
        except Exception as e:
            # Log or handle specific exceptions if needed
            # Returning error string for now, better handling might involve custom exceptions
            return f"Error generating content with Gemini: {e}"

    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get a chat response from Gemini."""
        try:
            gemini_history = []
            for msg in messages[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                gemini_history.append({"role": role, "parts": [msg["content"]]})

            # Filter out empty history items just in case
            gemini_history = [item for item in gemini_history if item['parts'] and item['parts'][0]]

            chat = self.model.start_chat(history=gemini_history)
            response = chat.send_message(messages[-1]["content"])

            if not response.parts:
                 last_user_message = messages[-1]['content']
                 return f"Gemini returned no content for chat. Last message: '{last_user_message[:100]}...'. Check safety settings or prompt."
            return response.text
        except Exception as e:
             return f"Error getting chat response from Gemini: {e}"


# OpenAI Implementation
class OpenAIProvider(LLMProvider):
    """OpenAI API provider implementation."""

    def __init__(self, api_key: str):
        """Initialize the OpenAI provider with API key."""
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            self.model = "gpt-3.5-turbo"
        except ImportError:
            raise ImportError("openai library not found. Please install it: pip install openai")
        except Exception as e:
            # Catch potential AuthenticationError specifically if possible
            raise ValueError(f"Failed to initialize OpenAI: Check API key. Error: {e}")


    def generate_content(self, prompt: str) -> str:
        """Generate content using OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            if response.choices:
                return response.choices[0].message.content
            return "Error: OpenAI returned no choices."
        except Exception as e:
            return f"Error generating content with OpenAI: {e}"

    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get a chat response from OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            if response.choices:
                return response.choices[0].message.content
            return "Error: OpenAI returned no choices for chat."
        except Exception as e:
            return f"Error getting chat response from OpenAI: {e}"

# Anthropic Implementation
class AnthropicProvider(LLMProvider):
    """Anthropic Claude API provider implementation."""

    def __init__(self, api_key: str):
        """Initialize the Anthropic provider with API key."""
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=api_key)
            self.model = "claude-3-haiku-20240307"
        except ImportError:
             raise ImportError("anthropic library not found. Please install it: pip install anthropic")
        except Exception as e:
            raise ValueError(f"Failed to initialize Anthropic: Check API key. Error: {e}")

    def generate_content(self, prompt: str) -> str:
        """Generate content using Anthropic."""
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=250, # Increased token limit slightly
                messages=[{"role": "user", "content": prompt}]
            )
            if response.content:
                 return response.content[0].text
            return "Error: Anthropic returned no content."
        except Exception as e:
            return f"Error generating content with Anthropic: {e}"

    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get a chat response from Anthropic."""
        try:
            system_prompt = None
            processed_messages = []
            if messages and messages[0]["role"] == "system":
                system_prompt = messages[0]["content"]
                processed_messages = messages[1:]
            else:
                processed_messages = messages

            # Filter empty messages (safer)
            processed_messages = [m for m in processed_messages if m.get("content")]

            if not processed_messages:
                return "Error: No valid messages to send to Anthropic."

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=processed_messages,
                system=system_prompt
            )
            if response.content:
                return response.content[0].text
            return "Error: Anthropic returned no content for chat."
        except Exception as e:
             return f"Error getting chat response from Anthropic: {e}"

# Mock Provider for Testing (No API Key Required)
class MockProvider(LLMProvider):
    """Mock LLM provider for testing without API keys."""
    # (Keep the MockProvider implementation as it was in the original code)
    # ... (Copy the full MockProvider class here) ...
    def __init__(self):
        """Initialize the mock provider."""
        pass

    def generate_content(self, prompt: str) -> str:
        """Generate mock content based on the prompt category."""
        time.sleep(0.5) # Simulate API latency
        prompt_lower = prompt.lower()

        # More sophisticated keyword matching
        if "geographical features" in prompt_lower or "geography" in prompt_lower:
             return "The land features vast mountain ranges with deep valleys carved by ancient rivers. The central plains give way to dense forests in the east and arid badlands in the west. Notable features include the Whispering Peaks and the Sunken City ruins near the coast."
        elif "climate" in prompt_lower:
            return "A temperate climate dominates the central regions with distinct seasons. Coastal areas experience mild, wet winters and warm, dry summers. The mountains have harsh, snowy winters, while the western badlands are extremely hot and arid year-round. Occasional magical storms sweep the plains."
        elif "flora" in prompt_lower or "fauna" in prompt_lower or "ecology" in prompt_lower:
             return "Native plants include the luminescent moon lily (night blooming, mild healing properties) and the hardy thornroot (edible tubers). Common animals are the six-legged mountain strider (used as a mount), the crystal-shelled desert crawler, and the winged shadow serpents that inhabit the canopy of the eastern forests."
        elif "natural resources" in prompt_lower or "resources" in prompt_lower:
             return "The mountains are rich in sky-iron ore and rare energy crystals. The forests provide abundant timber and medicinal herbs, while the plains are fertile for agriculture (grain, sky-grapes). Underground aquifers supply fresh water. The badlands contain deposits of volatile sunstone."
        elif "history" in prompt_lower or "timeline" in prompt_lower:
            return "Ancient Era: Dominated by the Sky Titans. Age of Shadow: A period of decline after the Titans vanished. Rise of Kingdoms: Emergence of humanoid civilizations. The Sundering: A magical cataclysm that reshaped the land. Current Age: Era of exploration and rebuilding, marked by tension between emerging factions."
        elif "customs" in prompt_lower:
             return "Coming-of-age rituals involve a solitary journey, often into the wilderness relevant to their homeland. Seasonal festivals celebrate the harvest (Autumn Equinox) and the longest night (Winter Solstice) with elaborate feasts, storytelling, and traditional dances."
        elif "traditions" in prompt_lower:
             return "Knowledge is passed through oral histories, often maintained by designated Lorekeepers. Crafting techniques, especially those involving sky-iron or sunstone, are closely guarded guild secrets. Ancestor veneration is common, with families maintaining small shrines."
        elif "religion" in prompt_lower or "spiritual beliefs" in prompt_lower:
             return "Most cultures practice animism, worshipping local nature spirits. Regional pantheons exist, with the Mountain Mother (earth/stone) and Sky Father (storms/stars) being prominent. Some follow the Path of Whispers, seeking lost Titan knowledge. Shadow Cults exist in hidden places."
        elif "language" in prompt_lower:
             return "Common Tongue: Trade language used across regions. Regional Dialects: Vary significantly. Example Greeting (Highland): 'Varesh-na!' (May the peaks watch over you). Farewell (Forest): 'Tornin-sul' (Until the leaves turn again). The written script resembles angular constellations."
        elif "appearance" in prompt_lower or "physical description" in prompt_lower:
             return "Varies by region. Highlanders: Tall, weathered skin, intricate braided hair. Forest Dwellers: Lithe, darker complexions, often adorned with natural materials. Plains Nomads: Stocky build, wear layered hides, distinctive facial tattoos denoting tribe and accomplishments."
        elif "personality" in prompt_lower or "psychological traits" in prompt_lower:
             return "Generally reserved with strangers but fiercely loyal to kin and clan. Value practicality, resilience, and community bonds. Highlanders are stoic, Forest Dwellers curious, Nomads pragmatic. All tend to be superstitious about ancient ruins and magic."
        elif "backstory" in prompt_lower or "formative experiences" in prompt_lower:
             return "Born under an unusual comet sign, considered auspicious by some, ill-omened by others. Trained from youth in traditional survival skills and regional lore. Left their village after a territorial dispute with a rival clan, carrying only an ancestral blade and a map fragment."
        elif "skills" in prompt_lower or "abilities" in prompt_lower:
             return "Expert tracker and navigator, using stars and natural landmarks. Proficient in herbalism, identifying both edible and poisonous plants. Skilled hunter with bow and spear. Basic knowledge of ancient runes. Limited proficiency in the Common Tongue."
        elif "aspirations" in prompt_lower or "goals" in prompt_lower:
             return "Seeks to find the legendary Sunken City mentioned in fragmented lore. Dreams of uniting the scattered highland clans against encroaching lowland kingdoms. Wishes to understand the true nature of the Sundering and prevent another cataclysm."
        elif "faction" in prompt_lower:
             return "The 'Skyguard Sentinels' are a faction dedicated to protecting ancient Titan sites. They are secretive, highly disciplined, and possess unique knowledge of aerial navigation using trained sky-mantas. Led by Commander Elara."
        elif "location" in prompt_lower:
            return "Aerie Peak: A settlement built into the cliffs of the Whispering Peaks. Known for its skilled artisans working sky-iron and its strategic vantage point. Accessible only by narrow mountain passes or trained flying mounts."
        else:
            # Generic fallback
            keywords = [word for word in prompt_lower.split() if len(word) > 4] # Basic keyword extraction
            return f"This is a mock response about '{', '.join(keywords)}'. The world is filled with wonders and mysteries waiting to be discovered by brave explorers and visionaries. Consider the interplay of magic, technology, and the diverse cultures shaped by the environment."

    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Return a mock chat response based on the last user message."""
        if not messages:
            return "How can I help you build your world?"
        # Ensure last message exists and has content
        last_message = messages[-1].get("content", "") if messages else ""
        if not last_message:
             return "Received an empty message in chat."

        # Simple logic: try to generate context-specific mock data, else give generic reply
        response = self.generate_content(f"Mock chat request about: {last_message}")
        if "mock response about" in response: # Check if it hit the generic fallback
             return f"Okay, let's think about '{last_message}'. In this world, that might involve ancient prophecies, hidden magical guilds, or perhaps conflicts over scarce resources like water or rare minerals. What specific aspect interests you most?"
        else:
            return response # Return the more specific mock data


# Hugging Face Implementation
class HuggingFaceProvider(LLMProvider):
    """Hugging Face API provider implementation."""

    def __init__(self, api_key: str, model_id: str = "mistralai/Mistral-7B-Instruct-v0.1"):
        """Initialize the Hugging Face provider with API key and model ID."""
        try:
            import requests
            self.requests = requests
        except ImportError:
             raise ImportError("requests library not found. Please install it: pip install requests")

        if not api_key:
            raise ValueError("Hugging Face API key is required.")
        self.api_key = api_key
        self.model_id = model_id
        self.api_url = f"https://api-inference.huggingface.co/models/{model_id}"
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def _query_hf_api(self, payload: Dict) -> Dict:
        """Helper function to query the Hugging Face API."""
        max_retries = 3
        initial_wait_time = 5

        for attempt in range(max_retries):
            try:
                response = self.requests.post(self.api_url, headers=self.headers, json=payload, timeout=60) # Added timeout
                response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

                result = response.json()
                # Handle successful response format (usually list for text-generation)
                if isinstance(result, list) and result:
                    return result[0] # Return the first dictionary in the list
                elif isinstance(result, dict): # Handle if API returns dict directly
                     return result
                else:
                    # Unexpected success format
                    return {"error": f"Unexpected successful response format: {type(result)}", "data": result}

            except self.requests.exceptions.HTTPError as http_err:
                status_code = http_err.response.status_code
                try:
                    error_payload = http_err.response.json()
                    error_message = error_payload.get('error', f'HTTP Error {status_code}')
                    estimated_time = error_payload.get('estimated_time')
                except json.JSONDecodeError:
                    error_message = f'HTTP Error {status_code} - Non-JSON response'
                    estimated_time = None

                if status_code == 503 and estimated_time is not None: # Model loading
                    wait_time = estimated_time if estimated_time > 0 else initial_wait_time
                    print(f"Model {self.model_id} is loading. Retrying in {wait_time:.2f} seconds...")
                    # Consider using st.warning here if running in streamlit context, but avoid direct st calls in backend
                    time.sleep(wait_time)
                    initial_wait_time *= 1.5
                else:
                    # For other HTTP errors, log and maybe retry once? Or fail faster.
                    print(f"Hugging Face API request failed (Attempt {attempt + 1}/{max_retries}): {error_message}")
                    if attempt < max_retries - 1:
                        time.sleep(2) # Short delay before final retry
                    else:
                        return {"error": f"API request failed after {max_retries} attempts: {error_message}"}

            except self.requests.exceptions.RequestException as req_err:
                # Network errors, timeouts, etc.
                print(f"Hugging Face request failed (Attempt {attempt + 1}/{max_retries}): {req_err}")
                if attempt < max_retries - 1:
                    time.sleep(5) # Longer delay for potential network issues
                else:
                    return {"error": f"API request failed after multiple connection attempts: {req_err}"}

        return {"error": "Max retries exceeded for Hugging Face API."}

    def generate_content(self, prompt: str) -> str:
        """Generate content using Hugging Face API."""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 250,
                "return_full_text": True,
                "temperature": 0.7
                }
        }
        result = self._query_hf_api(payload)

        if "error" in result:
            return f"Error generating content with Hugging Face: {result['error']}"

        # Expecting {"generated_text": "..."}
        generated_text = result.get("generated_text")
        if generated_text is not None:
             return generated_text.strip()
        else:
             # Unexpected successful format
             return f"Error: Could not parse 'generated_text' from Hugging Face response. Result: {result}"


    def get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get a chat response from Hugging Face. Requires careful prompt formatting."""
        # Basic Mistral/Llama2 instruct format - may need adjustment for other models
        chat_string = ""
        system_prompt = ""
        processed_messages = []

        # Extract system prompt
        if messages and messages[0]["role"] == "system":
             system_prompt = f"<<SYS>>\n{messages[0]['content']}\n<</SYS>>\n\n"
             processed_messages = messages[1:]
        else:
             processed_messages = messages

        # Format messages
        turn_strings = []
        for i, msg in enumerate(processed_messages):
            role = msg.get("role")
            content = msg.get("content", "").strip()
            if not content: continue # Skip empty messages

            if role == "user":
                 # Add [INST] only if it's the start or follows an assistant message
                 prefix = "[INST] " if i == 0 or processed_messages[i-1].get("role") == "assistant" else ""
                 turn_strings.append(f"{prefix}{content} [/INST]")
            elif role == "assistant":
                # Add assistant response, ensuring space before next potential [INST]
                turn_strings.append(f"{content} ") # Add trailing space

        # Combine, prepending system prompt if exists
        # Ensure the final string ends correctly (likely needs assistant response, but HF API adds that)
        chat_string = system_prompt + "".join(turn_strings).strip() # Strip trailing space if last was assistant

        # Add BOS token if needed by model (e.g., Llama2 often uses <s>)
        # This depends heavily on the specific model's requirements
        # chat_string = "<s>" + chat_string # Example

        if not chat_string:
             return "Error: Could not format chat messages for Hugging Face."

        # Call generate_content with the formatted chat string
        return self.generate_content(chat_string)