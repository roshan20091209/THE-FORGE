import os
import json
import httpx
from typing import Optional

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"
GROQ_BASE = "https://api.groq.com/openai/v1"


class LLMClient:
    def __init__(self, provider: str = "nvidia", model: Optional[str] = None):
        self.provider = provider
        self.model = model or self._default_model()
        self.client = httpx.Client(timeout=30.0)

    def _default_model(self) -> str:
        if self.provider == "nvidia":
            return "meta/llama-3.1-70b-instruct"
        elif self.provider == "groq":
            return "llama-3.1-70b-versatile"
        return "meta/llama-3.1-8b-instruct"

    def _headers(self) -> dict:
        if self.provider == "nvidia":
            return {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {NVIDIA_API_KEY}"
            }
        elif self.provider == "groq":
            return {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}"
            }
        return {}

    def _base_url(self) -> str:
        return NVIDIA_BASE if self.provider == "nvidia" else GROQ_BASE

    def chat(self, messages: list, temperature: float = 0.2, max_tokens: int = 1500) -> Optional[str]:
        try:
            response = self.client.post(
                f"{self._base_url()}/chat/completions",
                headers=self._headers(),
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "top_p": 0.7,
                    "stream": False
                }
            )
            if response.status_code != 200:
                print(f"LLM API error: {response.status_code} - {response.text}")
                return self._fallback(messages, temperature, max_tokens)

            data = response.json()
            return data["choices"][0]["message"]["content"]

        except Exception as e:
            print(f"LLM call failed: {e}")
            return self._fallback(messages, temperature, max_tokens)

    def _fallback(self, messages: list, temperature: float, max_tokens: int) -> Optional[str]:
        if self.provider == "nvidia" and GROQ_API_KEY:
            print("Falling back to Groq...")
            fallback = LLMClient(provider="groq")
            return fallback.chat(messages, temperature, max_tokens)
        return None

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


def create_embedding(text: str) -> list:
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                f"{NVIDIA_BASE}/embeddings",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {NVIDIA_API_KEY}"
                },
                json={
                    "model": "NV-Embed-QA",
                    "input": text,
                    "input_type": "query"
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data["data"][0]["embedding"]
    except Exception as e:
        print(f"Embedding error: {e}")

    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model.encode(text).tolist()
