import os

# Set dummy AWS credentials for unit tests before boto3 initialization
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_SECURITY_TOKEN"] = "testing"
os.environ["AWS_SESSION_TOKEN"] = "testing"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["DYNAMODB_ENDPOINT"] = ""
# Provide a test JWT secret (validator allows it when AWS_ACCESS_KEY_ID == "testing")
os.environ["JWT_SECRET_KEY"] = "alphaask-test-only-secret-not-for-production-use"
