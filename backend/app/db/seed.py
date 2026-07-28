import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[2]))

from app.db.database import SessionLocal
from app.db.models import User
from app.core.security import hash_password

def seed_db():
    db = SessionLocal()
    try:
        # Check if test student exists
        student_email = "student@university.edu"
        existing_user = db.query(User).filter(User.email == student_email).first()
        
        if existing_user:
            print(f"User '{student_email}' already exists.")
            return

        # Seed new user
        hashed = hash_password("securepassword123")
        new_user = User(email=student_email, hashed_password=hashed)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Successfully seeded user '{student_email}' (ID: {new_user.id})")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
