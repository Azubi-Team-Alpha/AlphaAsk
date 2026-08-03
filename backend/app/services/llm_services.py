import base64
import io
import json
import re
import urllib.request
import urllib.error
import boto3
from typing import Generator
from botocore.exceptions import ClientError, ReadTimeoutError
from botocore.config import Config
from pypdf import PdfReader
from app.core.config import settings

def get_bedrock_client():
    bedrock_config = Config(
        read_timeout=45,
        connect_timeout=10,
        retries={"max_attempts": 2, "mode": "standard"},
    )
    return boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_region,
        config=bedrock_config,
    )

SYSTEM_PROMPT = (
    "You are an academic support assistant for university students. "
    "Answer clearly, accurately, and thoroughly. Stay strictly on academic topics "
    "(coursework, research methods, study skills, referencing, subject explanations). "
    "If asked something off-topic, politely redirect the student back to academic questions. "
    "Structure your responses cleanly using clear Markdown (with headings, bullet points, numbered lists, and bold text for key concepts). "
    "When explaining processes, workflows, timelines, algorithms, biological/chemical pathways, or system architectures, include clean ```mermaid diagram code blocks to visualize the concepts. "
    "Provide detailed explanations, examples, and step-by-step guidance. Cite sources where relevant."
)


class LLMError(Exception):
    """Raised when the LLM call fails after our own error handling."""
    pass


def extract_pdf_with_pypdf(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        page_texts = []
        for idx, page in enumerate(reader.pages):
            t = page.extract_text()
            if t and t.strip():
                page_texts.append(f"--- Page {idx + 1} ---\n{t.strip()}")
        if page_texts:
            return "\n\n".join(page_texts)
    except Exception as e:
        print(f"pypdf extraction error: {e}")
    return ""


def clean_pdf_text_context(text: str) -> str:
    if not text:
        return ""

    # Check for base64 data URL or raw base64 string
    if text.startswith("data:") and ";base64," in text:
        try:
            _, base64_str = text.split(";base64,", 1)
            pdf_bytes = base64.b64decode(base64_str)
            extracted = extract_pdf_with_pypdf(pdf_bytes)
            if extracted:
                return extracted
        except Exception as e:
            print(f"Base64 PDF decode error: {e}")

    # Check if raw PDF stream bytes or %PDF header passed
    if "%PDF" in text or "obj" in text or "\ufffd" in text or "/FirstChar" in text:
        try:
            pdf_bytes = text.encode("latin1", errors="ignore")
            extracted = extract_pdf_with_pypdf(pdf_bytes)
            if extracted:
                return extracted
        except Exception as e:
            print(f"Latin1 PDF decode error: {e}")

        # Fallback: Extract text literals enclosed in (text)
        extracted_strings = re.findall(r'\(([^()]{2,})\)', text)
        if extracted_strings:
            clean_lines = [s.strip() for s in extracted_strings if not re.match(r'^[0-9\s/\\-]+$', s.strip()) and len(s.strip()) > 1]
            if len(clean_lines) > 3:
                return "\n".join(clean_lines)

        # Fallback: Filter out PDF metric arrays and dictionary keys
        lines = text.splitlines()
        filtered = []
        for line in lines:
            if re.search(r'/(FirstChar|LastChar|Widths|FontDescriptor|Encoding|Type|Subtype)', line, re.I):
                continue
            if re.match(r'^\s*(\d+\s+){4,}\d+\s*$', line):
                continue
            if re.match(r'^\s*\d+\s+\d+\s+obj\b', line, re.I) or line.strip().lower() in ("endobj", "stream", "endstream", "xref", "trailer"):
                continue
            if line.strip() and "\ufffd" not in line:
                filtered.append(line)
        return "\n".join(filtered)

    return text


def prepare_user_question(new_question: str, document_context: str | None = None) -> str:
    question = new_question.strip() or "Hello"
    if document_context and document_context.strip():
        cleaned_doc = clean_pdf_text_context(document_context)
        return (
            f"[ATTACHED STUDY DOCUMENT / LECTURE NOTES CONTEXT]:\n"
            f"```\n{cleaned_doc[:15000]}\n```\n\n"
            f"[STUDENT QUESTION]: {question}"
        )
    return question


def call_groq_api(conversation_history: list[dict], new_question: str, document_context: str | None = None) -> str:
    if not settings.groq_api_key:
        raise LLMError("GROQ_API_KEY is not configured.")

    url = "https://api.groq.com/openai/v1/chat/completions"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in conversation_history:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = (msg.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})

    question = prepare_user_question(new_question, document_context)
    messages.append({"role": "user", "content": question})

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 4096
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.groq_api_key}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlphaAskBackend/1.0",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="ignore")
        raise LLMError(f"Groq API Error ({err.code}): {err_body[:200]}")
    except Exception as e:
        raise LLMError(f"Groq API network error: {str(e)}")


def call_gemini_api(conversation_history: list[dict], new_question: str, document_context: str | None = None) -> str:
    if not settings.gemini_api_key:
        raise LLMError("GEMINI_API_KEY is not configured.")

    gemini_models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
    ]

    contents = []
    for msg in conversation_history:
        role = "user" if msg.get("role") == "user" else "model"
        content = (msg.get("content") or "").strip()
        if content:
            contents.append({"role": role, "parts": [{"text": content}]})

    question = prepare_user_question(new_question, document_context)
    contents.append({"role": "user", "parts": [{"text": question}]})

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 4096
        }
    }

    last_err = None
    for model in gemini_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.gemini_api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlphaAskBackend/1.0",
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8", errors="ignore")
            last_err = f"Gemini ({model}) Error ({err.code}): {err_body[:200]}"
            if err.code in (404, 400):
                continue
            break
        except Exception as e:
            last_err = f"Gemini ({model}) network error: {str(e)}"
            break

    raise LLMError(last_err or "Gemini API failed")


def call_bedrock_api(conversation_history: list[dict], new_question: str, document_context: str | None = None) -> str:
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

    question = prepare_user_question(new_question, document_context)

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
                "inferenceConfig": {"maxTokens": 4096, "temperature": 0.3},
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


def get_llm_response(conversation_history: list[dict], new_question: str, document_context: str | None = None) -> str:
    errors = []

    if settings.groq_api_key:
        try:
            return call_groq_api(conversation_history, new_question, document_context)
        except Exception as e:
            print(f"Groq API failed: {e}")
            errors.append(str(e))

    if settings.gemini_api_key:
        try:
            return call_gemini_api(conversation_history, new_question, document_context)
        except Exception as e:
            print(f"Gemini API failed: {e}")
            errors.append(str(e))

    try:
        return call_bedrock_api(conversation_history, new_question, document_context)
    except Exception as e:
        print(f"Bedrock API failed: {e}")
        errors.append(str(e))

    combined_err = " | ".join(errors) if errors else "No AI API providers configured."
    raise LLMError(f"Live AI APIs unavailable: {combined_err}")


def stream_llm_response(conversation_history: list[dict], new_question: str, document_context: str | None = None) -> Generator[str, None, None]:
    """Generates SSE formatted string stream. Uses native Groq streaming when available, falls back to full response."""

    # --- Try native Groq streaming first ---
    if settings.groq_api_key:
        try:
            yield from _stream_groq_native(conversation_history, new_question, document_context)
            return
        except Exception as e:
            print(f"Groq native stream failed, falling back: {e}")

    # --- Fallback: get full response from any provider then emit in chunks ---
    full_response = get_llm_response(conversation_history, new_question, document_context)
    words = full_response.split(" ")
    chunk_size = 3
    for i in range(0, len(words), chunk_size):
        chunk_text = " ".join(words[i:i + chunk_size]) + (" " if i + chunk_size < len(words) else "")
        yield f"data: {json.dumps({'content': chunk_text})}\n\n"


def _stream_groq_native(conversation_history: list[dict], new_question: str, document_context: str | None = None) -> Generator[str, None, None]:
    """Native streaming from Groq API using chunked HTTP transfer."""
    if not settings.groq_api_key:
        raise LLMError("GROQ_API_KEY is not configured.")

    url = "https://api.groq.com/openai/v1/chat/completions"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in conversation_history:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = (msg.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})

    question = prepare_user_question(new_question, document_context)
    messages.append({"role": "user", "content": question})

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 4096,
        "stream": True,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.groq_api_key}",
            "User-Agent": "Mozilla/5.0 AlphaAskBackend/1.0",
            "Accept": "text/event-stream",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            for raw_line in resp:
                line = raw_line.decode("utf-8").strip()
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield f"data: {json.dumps({'content': content})}\n\n"
                except (KeyError, json.JSONDecodeError):
                    continue
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="ignore")
        raise LLMError(f"Groq streaming error ({err.code}): {err_body[:200]}")
    except Exception as e:
        raise LLMError(f"Groq streaming network error: {str(e)}")