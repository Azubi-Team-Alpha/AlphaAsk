import boto3
from botocore.exceptions import ClientError, ReadTimeoutError
from botocore.config import Config
from app.core.config import settings

def get_bedrock_client():
    bedrock_config = Config(
        read_timeout=20,
        connect_timeout=5,
        retries={"max_attempts": 2, "mode": "standard"},
    )
    return boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_region,
        config=bedrock_config,
    )

SYSTEM_PROMPT = (
    "You are an academic support assistant for university students. "
    "Answer clearly and accurately. Stay strictly on academic topics "
    "(coursework, research methods, study skills, referencing, subject explanations). "
    "If asked something off-topic, politely redirect the student back to academic questions. "
    "Be concise. Use examples where helpful. Cite sources where relevant."
)


class LLMError(Exception):
    """Raised when the LLM call fails after our own error handling."""
    pass


def get_llm_response(conversation_history: list[dict], new_question: str) -> str:
    # Bedrock's Converse API expects messages as {"role": ..., "content": [{"text": ...}]}
    messages = []
    for msg in conversation_history:
        messages.append({
            "role": msg["role"] if msg["role"] in ("user", "assistant") else "user",
            "content": [{"text": msg["content"]}],
        })
    messages.append({"role": "user", "content": [{"text": new_question}]})

    model_candidates = [
        settings.bedrock_model_id,
        "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
        "us.anthropic.claude-3-haiku-20240307-v1:0",
        "amazon.titan-text-express-v1",
    ]
    # Remove duplicates preserving order
    seen = set()
    model_ids = [m for m in model_candidates if m and not (m in seen or seen.add(m))]

    client = get_bedrock_client()
    last_exception = None

    for model_id in model_ids:
        try:
            response = client.converse(
                modelId=model_id,
                system=[{"text": SYSTEM_PROMPT}],
                messages=messages,
                inferenceConfig={"maxTokens": 1024, "temperature": 0.3},
            )
            return response["output"]["message"]["content"][0]["text"]
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "ResourceNotFoundException" and model_id != model_ids[-1]:
                continue
            last_exception = e
            break
        except Exception as e:
            last_exception = e
            break

    if isinstance(last_exception, ReadTimeoutError):
        raise LLMError("The AI took too long to respond. Please try again.")
    elif isinstance(last_exception, ClientError):
        error_code = last_exception.response.get("Error", {}).get("Code", "")
        if error_code == "ThrottlingException":
            raise LLMError("The AI service is currently busy. Please try again shortly.")
        if error_code == "ValidationException":
            raise LLMError("The request could not be processed. Please rephrase your question.")
        raise LLMError(f"AI service error: {error_code}")
    else:
        raise LLMError(f"Unexpected AI service error: {str(last_exception or 'Unknown error')}")