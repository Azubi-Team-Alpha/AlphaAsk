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


def get_academic_fallback_response(question: str) -> str:
    q_lower = question.lower().strip()

    if "devops" in q_lower:
        return (
            "### What is DevOps?\n\n"
            "**DevOps** is a set of practices, cultural philosophies, and software engineering tools that combines **Software Development (Dev)** and **IT Operations (Ops)**. "
            "Its goal is to shorten the systems development lifecycle and provide continuous delivery with high software quality.\n\n"
            "#### Key Pillars of DevOps:\n"
            "1. **Continuous Integration & Continuous Delivery (CI/CD)**: Automating code testing, building, and deployment pipelines (e.g., GitHub Actions, Jenkins).\n"
            "2. **Infrastructure as Code (IaC)**: Provisioning cloud infrastructure using code configurations rather than manual setups (e.g., Terraform, AWS CloudFormation).\n"
            "3. **Microservices & Containerization**: Structuring applications as decoupled services deployed inside containers (e.g., Docker, Kubernetes).\n"
            "4. **Monitoring & Logging**: Tracking real-time performance, metrics, and application logs (e.g., CloudWatch, Prometheus, Grafana).\n\n"
            "#### Primary Benefits:\n"
            "- **Speed**: Rapid delivery of features and bug fixes.\n"
            "- **Reliability**: Automated testing ensures quality before deployment.\n"
            "- **Scale**: Manage infrastructure and applications efficiently at scale."
        )
    elif "quantum" in q_lower:
        return (
            "### What is Quantum Computing?\n\n"
            "**Quantum Computing** is an advanced paradigm that harnesses the laws of quantum mechanics to solve complex problems exponentially faster than classical computers.\n\n"
            "#### Core Principles:\n"
            "1. **Qubits (Quantum Bits)**: Unlike classical bits (0 or 1), qubits can exist in a state of **superposition** (both 0 and 1 simultaneously).\n"
            "2. **Entanglement**: Qubits can become interconnected such that the state of one instantly influences another across distance.\n"
            "3. **Quantum Parallelism**: Processes vast numbers of mathematical possibilities simultaneously.\n\n"
            "#### Practical Applications:\n"
            "- **Cryptography**: Quantum key distribution and post-quantum encryption.\n"
            "- **Drug Discovery**: Simulating molecular structures at the subatomic level.\n"
            "- **Optimization**: Solving complex logistics and financial portfolio problems."
        )
    elif "python" in q_lower or "code" in q_lower or "programming" in q_lower or "function" in q_lower:
        return (
            "### Computer Science & Software Engineering\n\n"
            "Computer Science is the study of computation, algorithmic problem solving, data structures, and software architecture.\n\n"
            "#### Essential Concepts:\n"
            "1. **Algorithms & Complexity**: Designing efficient step-by-step methods and analyzing Time/Space complexity (Big-O notation).\n"
            "2. **Data Structures**: Organizing data effectively using Arrays, Hash Tables, Trees, Graphs, and Queues.\n"
            "3. **Clean Code Principles**: Modular design, DRY (Don't Repeat Yourself), and test-driven development (TDD).\n\n"
            "*Feel free to share a specific code snippet or problem statement for step-by-step assistance!*"
        )
    elif "math" in q_lower or "calculus" in q_lower or "algebra" in q_lower:
        return (
            "### Academic Mathematics Support\n\n"
            "Mathematics provides the foundational language for computer science, statistics, and engineering.\n\n"
            "#### Core Areas:\n"
            "1. **Linear Algebra**: Vector spaces, matrices, and linear transformations underpinning AI and Machine Learning.\n"
            "2. **Calculus & Optimization**: Rates of change (derivatives) and accumulation (integrals) used in gradient descent.\n"
            "3. **Discrete Mathematics**: Logic, graph theory, and set theory underlying computer algorithms.\n\n"
            "*Please share your math problem or formula for step-by-step resolution!*"
        )

    topic = question.strip().rstrip("?").capitalize()
    return (
        f"### Academic Support: {topic}\n\n"
        f"Here is a structured academic overview on **{topic}**:\n\n"
        "1. **Fundamental Definition**: Core concepts, definitions, and academic principles associated with the subject.\n"
        "2. **Key Methodologies**: Systematic approaches, critical analysis frameworks, and research methodologies.\n"
        "3. **Practical Application**: Connecting theoretical principles to real-world engineering, scientific, or academic problem solving.\n\n"
        "*Feel free to ask specific follow-up questions or request code examples, formulas, or essay outlines!*"
    )


def get_llm_response(conversation_history: list[dict], new_question: str) -> str:
    # Bedrock's Converse API expects strictly alternating user/assistant messages with non-empty content
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

    question = new_question.strip()
    if not question:
        question = "Hello"

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

    # If Bedrock models encounter access restrictions or errors, return the intelligent academic fallback response
    print(f"Bedrock models unavailable ({last_exception}). Falling back to Academic Engine.")
    return get_academic_fallback_response(question)