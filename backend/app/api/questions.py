from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.db.dynamodb import dynamodb_service
from app.core.deps import get_current_user
from app.schemas.ask import QuestionOut, FAQOut

router = APIRouter(prefix="/question", tags=["questions"])


@router.get("", response_model=List[QuestionOut])
def list_questions(current_user: dict = Depends(get_current_user)):
    """List all questions asked by the current user."""
    # Get all user's sessions
    sessions = dynamodb_service.list_user_sessions(user_id=current_user["user_id"])
    
    if not sessions:
        return []
    
    # Get all user messages (questions) from all sessions
    result = []
    for session in sessions:
        messages = dynamodb_service.get_session_messages(session["session_id"])
        for msg in messages:
            if msg["role"] == "user":
                # Find the next message (assistant response) for this session
                messages_after = [m for m in messages if m["created_at"] > msg["created_at"] and m["role"] == "assistant"]
                answer = messages_after[0]["content"] if messages_after else "No answer yet"
                
                result.append(QuestionOut(
                    id=msg["message_id"],
                    question=msg["content"],
                    answer=answer,
                    session_id=msg["session_id"],
                    created_at=msg["created_at"]
                ))
    
    # Sort by created_at descending
    result.sort(key=lambda x: x.created_at, reverse=True)
    return result


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific question by ID."""
    # Get the question message
    # Note: DynamoDB doesn't have a direct way to get by message_id without knowing session_id
    # For now, we'll scan (not efficient but works for development)
    # In production, add a GSI on message_id
    
    # Get all user sessions
    sessions = dynamodb_service.list_user_sessions(user_id=current_user["user_id"])
    
    for session in sessions:
        messages = dynamodb_service.get_session_messages(session["session_id"])
        for msg in messages:
            if msg["message_id"] == question_id and msg["role"] == "user":
                # Find the corresponding answer
                messages_after = [m for m in messages if m["created_at"] > msg["created_at"] and m["role"] == "assistant"]
                answer = messages_after[0]["content"] if messages_after else "No answer yet"
                
                return QuestionOut(
                    id=msg["message_id"],
                    question=msg["content"],
                    answer=answer,
                    session_id=msg["session_id"],
                    created_at=msg["created_at"]
                )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Question not found"
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a specific question and its associated answer."""
    # Get all user sessions
    sessions = dynamodb_service.list_user_sessions(user_id=current_user["user_id"])
    
    for session in sessions:
        messages = dynamodb_service.get_session_messages(session["session_id"])
        for msg in messages:
            if msg["message_id"] == question_id and msg["role"] == "user":
                # Delete the question
                dynamodb_service.delete_message(question_id)
                
                # Find and delete the associated answer
                messages_after = [m for m in messages if m["created_at"] > msg["created_at"] and m["role"] == "assistant"]
                if messages_after:
                    dynamodb_service.delete_message(messages_after[0]["message_id"])
                
                return None
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Question not found"
    )


# FAQ router
faq_router = APIRouter(prefix="/FAQ", tags=["faq"])


@faq_router.get("", response_model=List[FAQOut])
def get_faq():
    """Get frequently asked questions (static for now, can be made dynamic)."""
    # For now, return static FAQs. In production, this could be:
    # 1. Stored in DynamoDB FAQ table
    # 2. Generated from most common questions
    # 3. Manually curated by admin
    
    from datetime import datetime, timezone
    
    static_faqs = [
        {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "question": "How do I use AlphaAsk?",
            "answer": "Simply type your academic question in the chat box and press Enter. Our AI will provide a detailed answer. You can also select a subject category to help frame your question.",
            "category": "Getting Started",
            "created_at": None
        },
        {
            "id": UUID("00000000-0000-0000-0000-000000000002"),
            "question": "What subjects can I ask about?",
            "answer": "You can ask questions about Math, Science, Writing, Code, History, and Study skills. Our AI is trained to provide academic support across these disciplines.",
            "category": "Subjects",
            "created_at": None
        },
        {
            "id": UUID("00000000-0000-0000-0000-000000000003"),
            "question": "Is my conversation history saved?",
            "answer": "Yes! If you're signed in, all your conversations are saved and you can access them anytime from the sidebar. Guest sessions are not saved when you close the tab.",
            "category": "Privacy",
            "created_at": None
        },
        {
            "id": UUID("00000000-0000-0000-0000-000000000004"),
            "question": "Can I share my conversations?",
            "answer": "Currently, conversations are private to your account. We're working on adding sharing features in future updates.",
            "category": "Features",
            "created_at": None
        },
        {
            "id": UUID("00000000-0000-0000-0000-000000000005"),
            "question": "How accurate are the AI answers?",
            "answer": "Our AI uses advanced language models trained on academic content. While answers are generally accurate, we always recommend verifying important information with your course materials or instructors.",
            "category": "Accuracy",
            "created_at": None
        }
    ]
    
    # Convert to FAQOut format
    faqs = []
    for faq in static_faqs:
        faqs.append(FAQOut(
            id=faq["id"],
            question=faq["question"],
            answer=faq["answer"],
            category=faq["category"],
            created_at=faq["created_at"] or datetime.now(timezone.utc)
        ))
    
    return faqs
