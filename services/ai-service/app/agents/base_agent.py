"""Base agent class for AI agents."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from anthropic import Anthropic
from openai import OpenAI
from loguru import logger

from app.core.config import settings
from app.models.article import AIProvider


class BaseAgent(ABC):
    """Base class for AI agents."""

    def __init__(
        self,
        name: str,
        provider: AIProvider = AIProvider.CLAUDE,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> None:
        """
        Initialize base agent.

        Args:
            name: Agent name for logging
            provider: AI provider to use
            temperature: Model temperature
            max_tokens: Maximum tokens for response
        """
        self.name = name
        self.provider = provider
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Initialize clients
        self.anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

        logger.info(f"Initialized {self.name} agent with provider: {self.provider.value}")

    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Get the system prompt for this agent.

        Returns:
            System prompt string
        """
        pass

    async def execute_with_claude(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Execute agent task with Claude.

        Args:
            user_message: User message/query
            context: Additional context data

        Returns:
            Agent response

        Raises:
            ValueError: If Claude client not configured
        """
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")

        system_prompt = self.get_system_prompt()

        # Add context to user message if provided
        if context:
            context_str = "\n\nContext:\n" + "\n".join(
                f"- {k}: {v}" for k, v in context.items()
            )
            user_message = user_message + context_str

        logger.debug(f"{self.name} executing with Claude: {user_message[:100]}...")

        response = self.anthropic_client.messages.create(
            model=settings.claude_model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        result = response.content[0].text
        logger.debug(f"{self.name} Claude response: {result[:100]}...")

        return result

    async def execute_with_openai(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Execute agent task with OpenAI.

        Args:
            user_message: User message/query
            context: Additional context data

        Returns:
            Agent response

        Raises:
            ValueError: If OpenAI client not configured
        """
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")

        system_prompt = self.get_system_prompt()

        # Add context to user message if provided
        if context:
            context_str = "\n\nContext:\n" + "\n".join(
                f"- {k}: {v}" for k, v in context.items()
            )
            user_message = user_message + context_str

        logger.debug(f"{self.name} executing with OpenAI: {user_message[:100]}...")

        response = self.openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )

        result = response.choices[0].message.content
        logger.debug(f"{self.name} OpenAI response: {result[:100]}...")

        return result

    async def execute(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Execute agent task with configured provider.

        Args:
            user_message: User message/query
            context: Additional context data

        Returns:
            Agent response
        """
        logger.info(f"{self.name} agent executing task")

        if self.provider == AIProvider.CLAUDE:
            return await self.execute_with_claude(user_message, context)
        elif self.provider == AIProvider.OPENAI:
            return await self.execute_with_openai(user_message, context)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
