import logging
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class ReasoningService:
    def __init__(self):
        # Chat Model: Fast, low latency (Default: Gemini 1.5 Flash)
        self.chat_llm = ChatGoogleGenerativeAI(
            model=settings.CHAT_MODEL, 
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.3
        )
        
        # Research Model: High reasoning (Default: Gemini 3 Flash Preview)
        self.research_llm = ChatGoogleGenerativeAI(
            model=settings.RESEARCH_MODEL, 
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.4
        )

    def _extract_text(self, content) -> str:
        """
        Helper to normalize LLM response content to string.
        Handles cases where content is a list of blocks.
        """
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            # Extract 'text' field from each block if possible
            parts = []
            for block in content:
                if isinstance(block, dict) and 'text' in block:
                    parts.append(block['text'])
                elif isinstance(block, str):
                    parts.append(block)
                else:
                    parts.append(str(block))
            return "\n".join(parts)
        return str(content)

    def get_answer(self, query: str, context: str, chat_history: str = "") -> str:
        prompt = PromptTemplate(
            input_variables=["context", "question", "chat_history"],
            template="""
            You are a precise academic assistant. Answer the question based ONLY on the following context.
            Do not hallucinate or use outside knowledge.
            If the answer is not found in the context, reply exactly: "I cannot answer this based on the provided documents."
            
            Chat History:
            {chat_history}

            Context:
            {context}
            
            Question: 
            {question}
            
            Instructions:
            1. You are a precise academic assistant.
            2. Answer based ONLY on the provided context.
            3. CRITICAL: Cite your sources for every claim using the format [Source: filename, Page: number]. 
               - Example: "The model uses attention [Source: paper.pdf, Page: 3]."
            4. If the exact page is not clear, use the Document name.
            5. Keep the answer concise and academic.
            """
        )
        chain = prompt | self.chat_llm
        response = chain.invoke({"context": context, "question": query, "chat_history": chat_history})
        return self._extract_text(response.content)

    def analyze_project(self, combined_context: str) -> dict:
        """
        Performs high-level analysis to find research gaps and suggestions.
        Returns a JSON-compatible dict.
        """
        prompt = PromptTemplate(
            input_variables=["context"],
            template="""
            You are a Principal Investigator in AI Research.
            Synthesize the provided research context (excerpts from multiple papers) to identify critical gaps.

            Step 1: Identify the "Common Thread". What approaches do most papers here take?
            Step 2: Detect "Missing Links". Are they all evaluating on the same dataset? Are they ignoring efficiency? Are there missing metrics?
            Step 3: Highlight "Unexplored Scenarios". What edge cases or domains are ignored?

            Context:
            {context}

            Instructions:
            - Base your analysis ONLY on the provided context.
            - Cite specific papers (e.g., [Paper: X]) where relevant.
            - Return the output as a strictly formatted JSON object with these keys: 
              "common_approaches" (list of strings),
              "missing_evaluations" (list of strings),
              "unexplored_scenarios" (list of strings),
              "research_gaps" (list of strings),
              "methodology_suggestions" (list of objects, each with "action", "reasoning", "citations").
            - Do not include markdown formatting (like ```json), just the raw JSON string.
            """
        )
        chain = prompt | self.research_llm
        try:
            response = chain.invoke({"context": combined_context})
            content_str = self._extract_text(response.content)
            content = content_str.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error in analysis: {e}")
            return {
                "research_gaps": ["Error generating gaps."],
                "methodology_suggestions": ["Error generating suggestions."]
            }

    def perform_deep_research(self, query: str, context: str, chat_history: str = "", project_title: str = "", project_description: str = "") -> dict:
        """
        Generates a comprehensive research report based on the query, context, and chat history.
        """
        prompt = PromptTemplate(
            input_variables=["context", "question", "chat_history", "project_title", "project_description"],
            template="""
            You are an expert AI Project Researcher assisting students with their project: "{project_title}".
            Project Description: "{project_description}"
            
            Your goal is to help them understand their project, identify gaps, and provide actionable suggestions.
            
            Chat History (Previous context):
            {chat_history}
            
            Current Problem Statement: 
            {question}
            
            Context (Excerpts from available papers):
            {context}
            
            Task:
            Write a detailed, structured research report or helpful response addressing the problem statement.
            If the user is asking a follow-up question, refer to the chat history to maintain strict continuity.
            
            Required Structure (Adapt based on query type):
            
            [IF THE USER GREETS ("Hi", "Hello") OR ASKS A SHORT CLARIFICATION]:
            - Do NOT provide a full report.
            - Respond conversationally as a helpful research mentor.
            - Ask them what specific aspect of the project they want to work on.
            
            [IF THE USER ASKS A COMPLEX RESEARCH QUESTION]:
            # [Title]
            ... (Standard report structure)
            
            Instructions:
            - Use Markdown formatting.
            - Cite sources [Paper: filename].
            - If context is empty, use general knowledge but state constraints.
            - Be encouraging and educational (Student-focused).
            - ADAPT YOUR OUTPUT LENGTH. Don't write a thesis usage for "Hi".
            """
        )
        chain = prompt | self.research_llm
        try:
            response = chain.invoke({
                "context": context, 
                "question": query, 
                "chat_history": chat_history,
                "project_title": project_title,
                "project_description": project_description
            })
            return {"report": self._extract_text(response.content)}
        except Exception as e:
            logger.error(f"Error in deep research: {e}")
            return {"report": "## Error\nFailed to generate research report."}

reasoning_service = ReasoningService()
