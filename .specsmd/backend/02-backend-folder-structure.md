# Backend Folder Structure

```text
backend/
│
├── pyproject.toml
├── requirements.txt
├── alembic.ini
├── .env.example
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── router.py
│   │       └── routes/
│   │           ├── auth.py
│   │           ├── workspaces.py
│   │           ├── projects.py
│   │           ├── srs.py
│   │           ├── diagrams.py
│   │           ├── generation_jobs.py
│   │           └── billing.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── permissions.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   │
│   ├── db/
│   │   ├── session.py
│   │   ├── base.py
│   │   └── models/
│   │       ├── user.py
│   │       ├── workspace.py
│   │       ├── workspace_member.py
│   │       ├── plan.py
│   │       ├── subscription.py
│   │       ├── usage_counter.py
│   │       ├── project.py
│   │       ├── requirement_input.py
│   │       ├── generation_job.py
│   │       ├── srs_document.py
│   │       ├── extracted_requirement.py
│   │       ├── diagram.py
│   │       ├── diagram_version.py
│   │       ├── diagram_requirement_link.py
│   │       ├── prompt_template.py
│   │       ├── llm_call.py
│   │       ├── payment_customer.py
│   │       └── invoice.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── workspace.py
│   │   ├── project.py
│   │   ├── srs.py
│   │   ├── requirement.py
│   │   ├── diagram.py
│   │   ├── generation_job.py
│   │   └── billing.py
│   │
│   ├── repositories/
│   │   ├── workspace_repository.py
│   │   ├── project_repository.py
│   │   ├── srs_repository.py
│   │   ├── diagram_repository.py
│   │   └── subscription_repository.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── workspace_service.py
│   │   ├── subscription_service.py
│   │   ├── usage_service.py
│   │   ├── generation_orchestrator.py
│   │   ├── llm_client.py
│   │   └── drawio_service.py
│   │
│   ├── srs_pipeline/
│   │   ├── summary_component.py
│   │   ├── requirement_extraction_component.py
│   │   ├── requirement_classification_component.py
│   │   └── srs_builder.py
│   │
│   ├── diagram_generators/
│   │   ├── base.py
│   │   ├── registry.py
│   │   └── class_diagram/
│   │       ├── llm_generator.py
│   │       ├── rule_based_generator.py
│   │       ├── noun_extractor.py
│   │       └── drawio_xml_builder.py
│   │
│   ├── templates/
│   │   ├── prompts/
│   │   │   ├── summary_prompt.txt
│   │   │   ├── extraction_prompt.txt
│   │   │   ├── classification_prompt.txt
│   │   │   └── class_diagram_prompt.txt
│   │   └── srs/
│   │       └── default_srs_template.md
│   │
│   └── workers/
│       └── generation_worker.py
│
├── alembic/
│   ├── env.py
│   └── versions/
│
└── tests/
    ├── unit/
    └── integration/
```
