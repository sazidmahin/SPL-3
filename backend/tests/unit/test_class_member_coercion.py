from app.rule_engine.pipeline import generate_drawio_xml
from app.services.generation_pipeline_service import _coerce_class_members


def test_string_attributes_and_methods_become_objects_the_renderer_accepts() -> None:
    payload = {
        "classes": [
            {
                "id": "class_001",
                "name": "Book",
                "attributes": ["title", "dueDate: Date", 42],
                "methods": ["renew(days: int): bool", "close"],
                "enabled": True,
            },
            {
                "id": "class_002",
                "name": "Member",
                "attributes": [{"id": "attr_member_name", "name": "name", "type": "String"}],
                "methods": [],
                "enabled": True,
            },
        ],
        "relationships": [],
    }

    coerced = _coerce_class_members(payload)

    book, member = coerced["classes"]
    assert book["attributes"] == [
        {"id": "attr_book_title", "name": "title"},
        {"id": "attr_book_due_date", "name": "dueDate", "type": "Date"},
    ]
    assert book["methods"] == [
        {"id": "method_book_renew", "name": "renew", "parameters": ["days: int"], "returnType": "bool"},
        {"id": "method_book_close", "name": "close", "parameters": []},
    ]
    assert member == payload["classes"][1]

    _, validation = generate_drawio_xml(coerced)
    assert validation["valid"], validation["errors"]
