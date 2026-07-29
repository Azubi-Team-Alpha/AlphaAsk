import json
import urllib.request
import urllib.error
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


def call_groq_api(conversation_history: list[dict], new_question: str) -> str:
    if not settings.groq_api_key:
        raise LLMError("GROQ_API_KEY is not configured.")

    url = "https://api.groq.com/openai/v1/chat/completions"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in conversation_history:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = (msg.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})

    question = new_question.strip() or "Hello"
    messages.append({"role": "user", "content": question})

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.groq_api_key}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="ignore")
        raise LLMError(f"Groq API Error ({err.code}): {err_body[:200]}")
    except Exception as e:
        raise LLMError(f"Groq API network error: {str(e)}")


def call_gemini_api(conversation_history: list[dict], new_question: str) -> str:
    if not settings.gemini_api_key:
        raise LLMError("GEMINI_API_KEY is not configured.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"

    contents = []
    for msg in conversation_history:
        role = "user" if msg.get("role") == "user" else "model"
        content = (msg.get("content") or "").strip()
        if content:
            contents.append({"role": role, "parts": [{"text": content}]})

    question = new_question.strip() or "Hello"
    contents.append({"role": "user", "parts": [{"text": question}]})

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="ignore")
        raise LLMError(f"Gemini API Error ({err.code}): {err_body[:200]}")
    except Exception as e:
        raise LLMError(f"Gemini API network error: {str(e)}")


def call_bedrock_api(conversation_history: list[dict], new_question: str) -> str:
    messages = []
    last_role = None

    for msg in conversation_history:
        role = "user" if msg.get("role") not in ("user", "assistant") else msg.get("role")
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        if role == last_role:
            if messages:
                messages[-1]["content"][0]["text"] += f"\n{content}"
            continue
        messages.append({"role": role, "content": [{"text": content}]})
        last_role = role

    question = new_question.strip() or "Hello"

    if last_role == "user" and messages:
        messages[-1]["content"][0]["text"] += f"\n{question}"
    else:
        messages.append({"role": "user", "content": [{"text": question}]})

    model_candidates = [
        "amazon.titan-text-express-v1",
        "us.amazon.nova-micro-v1:0",
        "us.anthropic.claude-3-haiku-20240307-v1:0",
        "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        settings.bedrock_model_id,
    ]
    seen = set()
    model_ids = [m for m in model_candidates if m and not (m in seen or seen.add(m))]

    client = get_bedrock_client()
    last_exception = None

    for model_id in model_ids:
        try:
            kwargs = {
                "modelId": model_id,
                "messages": messages,
                "inferenceConfig": {"maxTokens": 1024, "temperature": 0.3},
            }
            if "anthropic" in model_id.lower():
                kwargs["system"] = [{"text": SYSTEM_PROMPT}]

            response = client.converse(**kwargs)
            return response["output"]["message"]["content"][0]["text"]
        except ClientError as e:
            last_exception = e
            continue
        except Exception as e:
            last_exception = e
            break

    if isinstance(last_exception, ReadTimeoutError):
        raise LLMError("AWS Bedrock: The AI took too long to respond.")
    elif isinstance(last_exception, ClientError):
        error_code = last_exception.response.get("Error", {}).get("Code", "")
        error_msg = last_exception.response.get("Error", {}).get("Message", "")
        raise LLMError(f"AWS Bedrock Error ({error_code}): {error_msg}")
    else:
        raise LLMError(f"AWS Bedrock Exception: {str(last_exception or 'Unknown error')}")


def get_llm_response(conversation_history: list[dict], new_question: str) -> str:
    errors = []

    # 1. Try Groq Cloud API (Option 3) if key provided
    if settings.groq_api_key:
        try:
            return call_groq_api(conversation_history, new_question)
        except Exception as e:
            print(f"Groq API failed: {e}")
            errors.append(str(e))

    # 2. Try Google Gemini API (Option 1) if key provided
    if settings.gemini_api_key:
        try:
            return call_gemini_api(conversation_history, new_question)
        except Exception as e:
            print(f"Gemini API failed: {e}")
            errors.append(str(e))

    # 3. Try AWS Bedrock API
    try:
        return call_bedrock_api(conversation_history, new_question)
    except Exception as e:
        print(f"Bedrock API failed: {e}")
        errors.append(str(e))

    # Raise error detailing live API failure reasons
    combined_err = " | ".join(errors) if errors else "No AI API providers configured."
    raise LLMError(f"Live AI APIs unavailable: {combined_err}")