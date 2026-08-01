from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.dynamodb import dynamodb_service
from app.core.deps import get_current_user
from app.schemas.ask import QuestionOut, FAQOut

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=List[QuestionOut])
def list_questions(current_user: dict = Depends(get_current_user)):
    """List all questions asked by the current user (O(1) via UserQuestionsIndex GSI)."""
    records = dynamodb_service.get_user_questions(user_id=current_user["user_id"])
    return [
        QuestionOut(
            id=r["id"],
            question=r["question"],
            answer=r.get("answer", "No answer yet"),
            session_id=r["session_id"],
            created_at=r["created_at"],
        )
        for r in records
    ]


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific question by ID (O(1) via Questions table key)."""
    record = dynamodb_service.get_question_record(question_id)
    if not record or record.get("user_id") != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )
    return QuestionOut(
        id=record["id"],
        question=record["question"],
        answer=record.get("answer", "No answer yet"),
        session_id=record["session_id"],
        created_at=record["created_at"],
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a question record and its associated messages."""
    record = dynamodb_service.get_question_record(question_id)
    if not record or record.get("user_id") != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Remove from Questions table
    dynamodb_service.delete_question_record(question_id)

    # Also remove the user message from Messages table
    dynamodb_service.delete_message(question_id)


# ---------------------------------------------------------------------------
# FAQ router
# ---------------------------------------------------------------------------
faq_router = APIRouter(prefix="/FAQ", tags=["faq"])


@faq_router.get("", response_model=List[FAQOut])
def get_faq():
    """Get frequently asked questions."""
    from datetime import datetime, timezone

    static_faqs = [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "question": "How do I use AlphaAsk?",
            "answer": "Simply type your academic question in the chat box and press Enter. Our AI will provide a detailed answer. You can also select a subject category to help frame your question.",
            "category": "Getting Started",
        },
        {
            "id": "00000000-0000-0000-0000-000000000002",
            "question": "What subjects can I ask about?",
            "answer": "You can ask questions about Math, Science, Writing, Code, History, and Study skills. Our AI is trained to provide academic support across these disciplines.",
            "category": "Subjects",
        },
        {
            "id": "00000000-0000-0000-0000-000000000003",
            "question": "Is my conversation history saved?",
            "answer": "Yes! If you're signed in, all your conversations are saved and you can access them anytime from the sidebar. Guest sessions are not saved when you close the tab.",
            "category": "Privacy",
        },
        {
            "id": "00000000-0000-0000-0000-000000000004",
            "question": "Can I share my conversations?",
            "answer": "Currently, conversations are private to your account. We're working on adding sharing features in future updates.",
            "category": "Features",
        },
        {
            "id": "00000000-0000-0000-0000-000000000005",
            "question": "How accurate are the AI answers?",
            "answer": "Our AI uses advanced language models trained on academic content. While answers are generally accurate, we always recommend verifying important information with your course materials or instructors.",
            "category": "Accuracy",
        },
    ]

    now = datetime.now(timezone.utc)
    return [
        FAQOut(
            id=f["id"],
            question=f["question"],
            answer=f["answer"],
            category=f["category"],
            created_at=now,
        )
        for f in static_faqs
    ]
