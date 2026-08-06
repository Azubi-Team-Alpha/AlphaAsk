import os
import boto3
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from uuid import uuid4
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger("dynamodb")

# DynamoDB client setup
def get_dynamodb():
    """Get DynamoDB resource (uses local DynamoDB if DYNAMODB_ENDPOINT is set)"""
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT", settings.dynamodb_endpoint)
    if endpoint_url:
        return boto3.resource(
            "dynamodb",
            endpoint_url=endpoint_url,
            region_name=os.getenv("AWS_REGION", settings.aws_region),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test")
        )
    return boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", settings.aws_region))

# Table names
USERS_TABLE = os.getenv("USERS_TABLE", settings.users_table)
SESSIONS_TABLE = os.getenv("SESSIONS_TABLE", settings.sessions_table)
MESSAGES_TABLE = os.getenv("MESSAGES_TABLE", settings.messages_table)
QUESTIONS_TABLE = os.getenv("QUESTIONS_TABLE", settings.questions_table)
FAQ_TABLE = os.getenv("FAQ_TABLE", settings.faq_table)


class DynamoDBService:
    """Service for DynamoDB operations with resilient error handling & GSI queries"""
    
    def __init__(self):
        self.dynamodb = get_dynamodb()
        self.users_table = self.dynamodb.Table(USERS_TABLE)
        self.sessions_table = self.dynamodb.Table(SESSIONS_TABLE)
        self.messages_table = self.dynamodb.Table(MESSAGES_TABLE)
        self.questions_table = self.dynamodb.Table(QUESTIONS_TABLE)
        self.faq_table = self.dynamodb.Table(FAQ_TABLE)
    
    # User operations
    def create_user(self, email: str, name: str, hashed_password: str) -> Dict[str, Any]:
        """Create a new user"""
        user_id = str(uuid4())
        item = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "hashed_password": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            self.users_table.put_item(Item=item)
        except ClientError as e:
            logger.error(f"Error creating user: {e}")
            raise
        return item
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email using EmailIndex GSI or scan fallback"""
        try:
            response = self.users_table.query(
                IndexName="EmailIndex",
                KeyConditionExpression="email = :email",
                ExpressionAttributeValues={":email": email}
            )
            items = response.get("Items", [])
            if items:
                return items[0]
            # Fallback to scan if GSI is backfilling
            response = self.users_table.scan(
                FilterExpression="email = :email",
                ExpressionAttributeValues={":email": email}
            )
            items = response.get("Items", [])
            return items[0] if items else None
        except Exception as e:
            logger.warning(f"DynamoDB get_user_by_email failed: {e}")
            return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            response = self.users_table.get_item(Key={"user_id": user_id})
            return response.get("Item")
        except Exception as e:
            logger.warning(f"DynamoDB get_user_by_id failed: {e}")
            return None
    
    # Session operations
    def create_session(self, user_id: str) -> Dict[str, Any]:
        """Create a new session"""
        session_id = str(uuid4())
        item = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            self.sessions_table.put_item(Item=item)
        except ClientError as e:
            logger.error(f"Error creating session: {e}")
            raise
        return item
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        try:
            response = self.sessions_table.get_item(Key={"session_id": session_id})
            return response.get("Item")
        except ClientError as e:
            logger.warning(f"DynamoDB get_session failed: {e}")
            return None
    
    def list_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """List all sessions for a user"""
        try:
            response = self.sessions_table.query(
                IndexName="UserSessionsIndex",
                KeyConditionExpression="user_id = :user_id",
                ExpressionAttributeValues={":user_id": user_id}
            )
            return response.get("Items", [])
        except ClientError:
            pass

        # Fallback scan
        try:
            response = self.sessions_table.scan(
                FilterExpression="user_id = :user_id",
                ExpressionAttributeValues={":user_id": user_id}
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.warning(f"DynamoDB list_user_sessions failed: {e}")
            return []
    
    # Message operations
    def create_message(self, session_id: str, role: str, content: str) -> Dict[str, Any]:
        """Create a new message"""
        message_id = str(uuid4())
        item = {
            "message_id": message_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            self.messages_table.put_item(Item=item)
        except ClientError as e:
            logger.error(f"Error creating message: {e}")
            raise
        return item
    
    def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a session sorted chronologically (user question first, assistant answer second)"""
        try:
            response = self.messages_table.query(
                IndexName="SessionMessagesIndex",
                KeyConditionExpression="session_id = :session_id",
                ExpressionAttributeValues={":session_id": session_id}
            )
            items = response.get("Items", [])
            items.sort(key=lambda x: (x.get("created_at", ""), 0 if x.get("role") == "user" else 1))
            return items
        except ClientError:
            pass

        # Fallback scan
        try:
            response = self.messages_table.scan(
                FilterExpression="session_id = :session_id",
                ExpressionAttributeValues={":session_id": session_id}
            )
            items = response.get("Items", [])
            items.sort(key=lambda x: (x.get("created_at", ""), 0 if x.get("role") == "user" else 1))
            return items
        except ClientError as e:
            logger.warning(f"DynamoDB get_session_messages failed: {e}")
            return []

    
    def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get conversation history for context (limited to recent messages sorted chronologically)"""
        all_msgs = self.get_session_messages(session_id)
        if not all_msgs:
            return []
        return all_msgs[-limit:] if limit else all_msgs
    
    def delete_message(self, message_id: str) -> None:
        """Delete a message"""
        try:
            self.messages_table.delete_item(Key={"message_id": message_id})
        except ClientError as e:
            logger.warning(f"DynamoDB delete_message failed: {e}")
    
    # FAQ operations
    def create_faq(self, question: str, answer: str, category: str) -> Dict[str, Any]:
        """Create a new FAQ"""
        faq_id = str(uuid4())
        item = {
            "faq_id": faq_id,
            "question": question,
            "answer": answer,
            "category": category,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            self.faq_table.put_item(Item=item)
        except ClientError as e:
            logger.error(f"Error creating FAQ: {e}")
            raise
        return item
    
    def get_all_faqs(self) -> List[Dict[str, Any]]:
        """Get all FAQs"""
        try:
            response = self.faq_table.scan()
            return response.get("Items", [])
        except ClientError as e:
            logger.warning(f"DynamoDB get_all_faqs failed: {e}")
            return []
    
    def get_faq_by_id(self, faq_id: str) -> Optional[Dict[str, Any]]:
        """Get FAQ by ID"""
        try:
            response = self.faq_table.get_item(Key={"faq_id": faq_id})
            return response.get("Item")
        except ClientError as e:
            logger.warning(f"DynamoDB get_faq_by_id failed: {e}")
            return None

    # Questions table operations
    def create_question_record(
        self,
        user_id: str,
        session_id: str,
        message_id: str,
        question: str,
        answer: str,
    ) -> Dict[str, Any]:
        """Write a question+answer pair into the Questions table for fast user-scoped lookup."""
        item = {
            "id": message_id,
            "user_id": user_id,
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            self.questions_table.put_item(Item=item)
        except ClientError as e:
            logger.warning(f"DynamoDB create_question_record failed: {e}")
        return item

    def get_user_questions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all question records for a user via UserQuestionsIndex GSI."""
        try:
            response = self.questions_table.query(
                IndexName="UserQuestionsIndex",
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
                ScanIndexForward=False,
            )
            return response.get("Items", [])
        except ClientError:
            pass
        # Fallback: scan with filter
        try:
            response = self.questions_table.scan(
                FilterExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
            )
            items = response.get("Items", [])
            items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return items
        except ClientError as e:
            logger.warning(f"DynamoDB get_user_questions failed: {e}")
            return []

    def get_question_record(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Get a single question record by ID."""
        try:
            response = self.questions_table.get_item(Key={"id": question_id})
            return response.get("Item")
        except ClientError as e:
            logger.warning(f"DynamoDB get_question_record failed: {e}")
            return None

    def delete_question_record(self, question_id: str) -> None:
        """Delete a question record from the Questions table."""
        try:
            self.questions_table.delete_item(Key={"id": question_id})
        except ClientError as e:
            logger.warning(f"DynamoDB delete_question_record failed: {e}")


# Global instance
dynamodb_service = DynamoDBService()
