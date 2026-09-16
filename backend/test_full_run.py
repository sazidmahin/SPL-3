import time
from uuid import UUID

from app.db.session import SessionLocal
from app.db.models import WorkspaceMember
from app.services import generation_pipeline_service as svc

WORKSPACE_ID = UUID("890b0f10-5a6c-4cc0-bf19-562f9a341b46")
PROJECT_ID = UUID("0bb7a20f-c954-40a7-b5ed-0774c7b4b877")

db = SessionLocal()
membership = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == WORKSPACE_ID).first()

t_total = time.time()
run = svc.create_pipeline_run(
    db,
    membership=membership,
    project_id=PROJECT_ID,
    title="Full run verification",
    raw_text=(
        "We are building a hospital appointment management system. Patients should be able to "
        "register, search for doctors by specialty, and book an appointment. Doctors need a way "
        "to view their daily schedule. When a doctor cancels an appointment, the system shall "
        "notify the affected patient by SMS."
    ),
    generation_mode="ollama",
)
run_id = run["id"]
print("run created:", run_id)

stage_order = ["input", "clarifications", "final-story", "requirements", "class-model", "xml"]

for stage in stage_order:
    current = svc.get_pipeline_run(db, membership=membership, project_id=PROJECT_ID, run_id=run_id)
    rev = next(s for s in current["stages"] if s["stage_name"] == stage)
    if stage == "clarifications":
        # auto-fill any unanswered questions so approval doesn't block on human review
        payload = dict(rev["payload"])
        answers = list(payload.get("answers", []))
        answered_ids = {a.get("questionStableId") for a in answers}
        for q in payload.get("clarificationQuestions", []):
            if q.get("id") not in answered_ids:
                answers.append({"questionStableId": q.get("id"), "answerText": "N/A", "appliedSlot": None})
        payload["answers"] = answers
        rev = svc.save_stage_revision(
            db, membership=membership, project_id=PROJECT_ID, run_id=run_id,
            stage_name=stage, payload=payload, expected_version=rev["version_number"],
        )
    t0 = time.time()
    result = svc.approve_stage(
        db, membership=membership, project_id=PROJECT_ID, run_id=run_id,
        stage_name=stage, version_number=rev["version_number"], proceed=True,
    )
    elapsed = round(time.time() - t0, 2)
    print(f"approved '{stage}' -> now at '{result['current_stage']}' (status={result['status']}) in {elapsed}s")
    if result["status"] == "completed":
        break

print("TOTAL elapsed:", round(time.time() - t_total, 2), "s")
final = svc.get_pipeline_run(db, membership=membership, project_id=PROJECT_ID, run_id=run_id)
xml_rev = next((s for s in final["stages"] if s["stage_name"] == "xml"), None)
print("xml present:", bool(xml_rev and xml_rev["payload"].get("xml")))
print("final run status:", final["status"])

db.execute(__import__('sqlalchemy').text("delete from generation_pipeline_runs where id = :id"), {"id": str(run_id)})
db.commit()
db.close()
print("cleaned up test run")
