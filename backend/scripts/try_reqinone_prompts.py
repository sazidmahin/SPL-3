"""Run the ReqInOne prompts once against the configured AI-generation model and print what comes back.

Usage (inside the backend container): python scripts/try_reqinone_prompts.py
Makes a handful of real model calls, so it costs a little.
"""

import json

from app.services.hosted_ai_service import HostedAiClient
from app.services.llm_json import parse_json_response
from app.services.llm_service import LlmRequest, _PLACEHOLDER
from app.services.reqinone_prompts import CLASSIFICATION_TEMPLATE, EXTRACTION_TEMPLATE, SUMMARY_COMMANDS, SUMMARY_TEMPLATE

SOURCE = """Original stakeholder text:
A library management system lets members borrow and reserve books. A librarian can add, update and remove books. Each book has a title, an author and an ISBN. A member can borrow up to five books at a time. The system must respond to searches within 2 seconds.

Reviewed story, one need per line, with the clarification answers applied:
- [S1] A member can borrow up to five books at a time.
- [S2] A member can reserve a book that is on loan.
- [S3] A librarian can add, update and remove books.
- [S4] Each book has a title, an author and an ISBN.
- [S5] The system responds to catalogue searches within 2 seconds."""


def render(template: str, variables: dict[str, str]) -> str:
    return _PLACEHOLDER.sub(lambda match: variables[match.group(1)], template)


def ask(client: HostedAiClient, prompt: str) -> dict:
    response = client.generate(LlmRequest(prompt=prompt, purpose="try_reqinone", response_format="json"))
    parsed = parse_json_response(response.content)
    if not isinstance(parsed, dict):
        raise SystemExit(f"Not a JSON object:\n{response.content}")
    return parsed


client = HostedAiClient()
print("model:", client.model_name)
extracted = ask(client, render(EXTRACTION_TEMPLATE, {"source_text": SOURCE, "past_corrections": "None"}))
requirements = extracted["requirements"]
for item in requirements:
    print(json.dumps(item, ensure_ascii=False))

numbered = "\n".join(f"{index}. {item['statement']}" for index, item in enumerate(requirements, start=1))
classified = ask(client, render(CLASSIFICATION_TEMPLATE, {"requirements": numbered}))
for item in classified["classifications"]:
    print(json.dumps(item, ensure_ascii=False))

actors = sorted({item.get("actor") for item in requirements if item.get("actor") and item.get("actor") != "System"})
for command, key, output_format in SUMMARY_COMMANDS:
    answer = ask(
        client,
        render(
            SUMMARY_TEMPLATE,
            {"source_text": SOURCE, "known_actors": ", ".join(actors), "command": command, "output_format": output_format},
        ),
    )
    print(key, "->", json.dumps(answer, ensure_ascii=False)[:600])
