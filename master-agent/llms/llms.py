from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI, AzureChatOpenAI


class LLMFactory:
    _registry = {}

    @classmethod
    def register(cls, name: str):
        def decorator(constructor):
            cls._registry[name] = constructor
            return constructor

        return decorator

    @classmethod
    def create(cls, configs: dict[str, Any]) -> BaseChatModel:
        llm_provider = configs.get("provider", "").lower()
        constructor = cls._registry.get(llm_provider)

        if not constructor:
            raise ValueError(f"Unknown LLM provider: {llm_provider}")

        return constructor(configs)


@LLMFactory.register("openai")
def __create_openai_model(configs: dict[str, Any]) -> ChatOpenAI:
    return ChatOpenAI(
        api_key=configs.get("api_key"),
        model=configs.get("model"),
        temperature=configs.get("temperature")
    )


@LLMFactory.register("azure openai")
def __create_azure_openai_model(configs: dict[str, Any]) -> AzureChatOpenAI:
    return AzureChatOpenAI(
        azure_endpoint=configs.get("endpoint"),
        api_key=configs.get("api_key"),
        api_version=configs.get("api_version"),
        deployment_name=configs.get("model"),
        temperature=configs.get("temperature")
    )


@LLMFactory.register("ollama")
def __create_ollama_model(configs: dict[str, Any]) -> ChatOllama:
    return ChatOllama(
        model=configs.get("model"),
        base_url=configs.get("base_url"),
        temperature=configs.get("temperature")
    )
