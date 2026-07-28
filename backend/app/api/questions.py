from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from uuid import UUID
from typing import List

from app.db.database import get_db
from app.db.models import User, Session as ChatSession, Message
from app.core.deps import get_current_user
from app.schemas.ask import QuestionOut, FAQOut

router = APIRouter(prefix="/question", tags=["questions"])


@router.get("", response_model=List[QuestionOut])
def list_questions(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all questions asked by the current user."""
    # Get all user's sessions
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .all()
    )
    
    if not sessions:
        return []
    
    session_ids = [s.id for s in sessions]
    
    # Get all user messages (questions)
    questions = (
        db.query(Message)
        .filter(
            Message.session_id.in_(session_ids),
            Message.role == "user"
        )
        .order_by(Message.created_at.desc())
        .all()
    )
    
    # For each question, find the corresponding assistant answer
    result = []
    for q in questions:
        # Find the next message (assistant response) for this session
        answer = (
            db.query(Message)
            .filter(
                Message.session_id == q.session_id,
                Message.role == "assistant",
                Message.created_at > q.created_at
            )
            .order_by(Message.created_at.asc())
            .first()
        )
        
        result.append(QuestionOut(
            id=q.id,
            question=q.content,
            answer=answer.content if answer else "No answer yet",
            session_id=q.session_id,
            created_at=q.created_at
        ))
    
    return result


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: UUID,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific question by ID."""
    # Get the question message
    question = (
        db.query(Message)
        .filter(Message.id == question_id, Message.role == "user")
        .first()
    )
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Verify the question belongs to the current user
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == question.session_id)
        .first()
    )
    
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Find the corresponding answer
    answer = (
        db.query(Message)
        .filter(
            Message.session_id == question.session_id,
            Message.role == "assistant",
            Message.created_at > question.created_at
        )
        .order_by(Message.created_at.asc())
        .first()
    )
    
    return QuestionOut(
        id=question.id,
        question=question.content,
        answer=answer.content if answer else "No answer yet",
        session_id=question.session_id,
        created_at=question.created_at
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: UUID,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific question and its associated answer."""
    # Get the question message
    question = (
        db.query(Message)
        .filter(Message.id == question_id, Message.role == "user")
        .first()
    )
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Verify the question belongs to the current user
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == question.session_id)
        .first()
    )
    
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete the question
    db.delete(question)
    
    # Delete the associated answer if it exists
    answer = (
        db.query(Message)
        .filter(
            Message.session_id == question.session_id,
            Message.role == "assistant",
            Message.created_at > question.created_at
        )
        .order_by(Message.created_at.asc())
        .first()
    )
    
    if answer:
        db.delete(answer)
    
    db.commit()
    
    return None


# FAQ router
faq_router = APIRouter(prefix="/FAQ", tags=["faq"])


@faq_router.get("", response_model=List[FAQOut])
def get_faq(db: DBSession = Depends(get_db)):
    """Get frequently asked questions (static for now, can be made dynamic)."""
    # For now, return static FAQs. In production, this could be:
    # 1. Stored in a separate FAQ table
    # 2. Generated from most common questions
    # 3. Manually curated by admin
    
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
    from datetime import datetime, timezone
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
