from .core.llm_providers import (
    LLMProvider,
    GeminiProvider,
    OpenAIProvider,
    AnthropicProvider,
    MockProvider,
    HuggingFaceProvider,
    DeepSeekProvider
)
PROVIDER_OPTIONS = {
    "Mock (No API)": ("mock", MockProvider),
    "Google Gemini": ("gemini", GeminiProvider),
    "OpenAI": ("openai", OpenAIProvider),
    "Anthropic Claude": ("anthropic", AnthropicProvider),
    "Hugging Face": ("huggingface", HuggingFaceProvider),
    "Deepseek": ("Deepseek", DeepSeekProvider)
}