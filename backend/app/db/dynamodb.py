import os
import boto3
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import uuid4

# DynamoDB client setup
def get_dynamodb():
    """Get DynamoDB resource (uses local DynamoDB if DYNAMODB_ENDPOINT is set)"""
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT")
    if endpoint_url:
        return boto3.resource(
            "dynamodb",
            endpoint_url=endpoint_url,
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test")
        )
    return boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", "us-east-1"))

# Table names
USERS_TABLE = os.getenv("USERS_TABLE", "Users")
SESSIONS_TABLE = os.getenv("SESSIONS_TABLE", "Sessions")
MESSAGES_TABLE = os.getenv("MESSAGES_TABLE", "Messages")
FAQ_TABLE = os.getenv("FAQ_TABLE", "FAQ")


class DynamoDBService:
    """Service for DynamoDB operations"""
    
    def __init__(self):
        self.dynamodb = get_dynamodb()
        self.users_table = self.dynamodb.Table(USERS_TABLE)
        self.sessions_table = self.dynamodb.Table(SESSIONS_TABLE)
        self.messages_table = self.dynamodb.Table(MESSAGES_TABLE)
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
            "created_at": datetime.utcnow().isoformat()
        }
        self.users_table.put_item(Item=item)
        return item
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        response = self.users_table.get_item(Key={"email": email})
        return response.get("Item")
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        response = self.users_table.get_item(Key={"user_id": user_id})
        return response.get("Item")
    
    # Session operations
    def create_session(self, user_id: str) -> Dict[str, Any]:
        """Create a new session"""
        session_id = str(uuid4())
        item = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat()
        }
        self.sessions_table.put_item(Item=item)
        return item
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        response = self.sessions_table.get_item(Key={"session_id": session_id})
        return response.get("Item")
    
    def list_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """List all sessions for a user"""
        # Using query with GSI on user_id (assuming GSI exists)
        # For now, we'll scan (not efficient but works for development)
        response = self.sessions_table.scan(
            FilterExpression="user_id = :user_id",
            ExpressionAttributeValues={":user_id": user_id}
        )
        return response.get("Items", [])
    
    # Message operations
    def create_message(self, session_id: str, role: str, content: str) -> Dict[str, Any]:
        """Create a new message"""
        message_id = str(uuid4())
        item = {
            "message_id": message_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "created_at": datetime.utcnow().isoformat()
        }
        self.messages_table.put_item(Item=item)
        return item
    
    def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a session"""
        response = self.messages_table.query(
            KeyConditionExpression="session_id = :session_id",
            ExpressionAttributeValues={":session_id": session_id},
            ScanIndexForward=True  # Ascending order by created_at
        )
        return response.get("Items", [])
    
    def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get conversation history for context (limited)"""
        response = self.messages_table.query(
            KeyConditionExpression="session_id = :session_id",
            ExpressionAttributeValues={":session_id": session_id},
            ScanIndexForward=True,
            Limit=limit
        )
        return response.get("Items", [])
    
    def delete_message(self, message_id: str) -> None:
        """Delete a message"""
        self.messages_table.delete_item(Key={"message_id": message_id})
    
    # FAQ operations
    def create_faq(self, question: str, answer: str, category: str) -> Dict[str, Any]:
        """Create a new FAQ"""
        faq_id = str(uuid4())
        item = {
            "faq_id": faq_id,
            "question": question,
            "answer": answer,
            "category": category,
            "created_at": datetime.utcnow().isoformat()
        }
        self.faq_table.put_item(Item=item)
        return item
    
    def get_all_faqs(self) -> List[Dict[str, Any]]:
        """Get all FAQs"""
        response = self.faq_table.scan()
        return response.get("Items", [])
    
    def get_faq_by_id(self, faq_id: str) -> Optional[Dict[str, Any]]:
        """Get FAQ by ID"""
        response = self.faq_table.get_item(Key={"faq_id": faq_id})
        return response.get("Item")


# Global instance
dynamodb_service = DynamoDBService()
