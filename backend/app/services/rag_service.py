"""Correction-memory RAG loop for the Ollama pipeline.

Whenever a user edits an Ollama-authored pipeline stage before approving it,
that edit is captured as a (wrong, corrected) pair for that stage. On future
generations of the same stage, the most similar past corrections (by cosine
similarity over Ollama-embedded query text, scoped per stage) are looked up and
fed into the prompt as "you got this wrong before, here is what was actually
correct" examples.

Entirely gated by settings.rag_enabled - when off, no embedding calls are made,
nothing is captured, and generation behaves exactly as it did before this
feature existed. Corrections are persisted to the generation_corrections table
so they survive a restart; similarity search itself runs over an in-memory
index built from that table, avoiding a pgvector/external vector-DB dependency
for what is expected to stay a small number of rows.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import GenerationCorrection, GenerationPipelineRun
from app.services.ollama_service import OllamaClient

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CorrectionMatch:
    query_text: str
    wrong_payload: dict[str, Any]
    corrected_payload: dict[str, Any]
    similarity: float


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class InMemoryVectorStore:
    """A small in-process (workspace_id, stage_name) -> [(embedding, entry)] index.

    Rebuilt from the database lazily on first use per worker process. This is
    intentionally not a persistent store itself - generation_corrections rows in
    Postgres are the durable record; this is just a fast runtime cache over them.
    """

    def __init__(self) -> None:
        self._loaded = False
        self._entries: list[tuple[UUID, str, list[float], GenerationCorrection]] = []

    def _ensure_loaded(self, db: Session) -> None:
        if self._loaded:
            return
        rows = db.scalars(select(GenerationCorrection)).all()
        self._entries = [(row.workspace_id, row.stage_name, row.embedding, row) for row in rows]
        self._loaded = True

    def add(self, row: GenerationCorrection) -> None:
        self._entries.append((row.workspace_id, row.stage_name, row.embedding, row))

    def search(
        self,
        db: Session,
        *,
        workspace_id: UUID,
        stage_name: str,
        query_embedding: list[float],
        top_k: int,
        min_similarity: float,
    ) -> list[CorrectionMatch]:
        self._ensure_loaded(db)
        scored: list[tuple[float, GenerationCorrection]] = []
        for entry_workspace_id, entry_stage_name, embedding, row in self._entries:
            if entry_workspace_id != workspace_id or entry_stage_name != stage_name:
                continue
            similarity = _cosine_similarity(query_embedding, embedding)
            if similarity >= min_similarity:
                scored.append((similarity, row))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            CorrectionMatch(
                query_text=row.query_text,
                wrong_payload=row.wrong_payload,
                corrected_payload=row.corrected_payload,
                similarity=similarity,
            )
            for similarity, row in scored[:top_k]
        ]


_vector_store = InMemoryVectorStore()


def _embed(text: str) -> list[float] | None:
    try:
        return OllamaClient().embed(text)
    except Exception as exc:  # noqa: BLE001 - RAG must never break generation
        logger.warning("RAG embedding call failed, skipping: reason=%s", exc)
        return None


def capture_correction(
    db: Session,
    *,
    run: GenerationPipelineRun,
    stage_name: str,
    wrong_payload: dict[str, Any],
    corrected_payload: dict[str, Any],
) -> None:
    """Record that a user corrected an Ollama-authored stage draft.

    Scoped to generation_mode == "ollama" only: this feature exists because a
    small local model repeats the same mistakes, which is not the failure mode
    byok/srsgen's larger hosted models have in the same way.
    """
    if not settings.rag_enabled or run.generation_mode != "ollama":
        return
    if stage_name in {"input", "xml"}:
        return  # always rule-engine output, never Ollama-authored, regardless of mode
    if wrong_payload == corrected_payload:
        return
    embedding = _embed(run.raw_text)
    if embedding is None:
        return
    row = GenerationCorrection(
        workspace_id=run.workspace_id,
        project_id=run.project_id,
        run_id=run.id,
        stage_name=stage_name,
        generation_mode=run.generation_mode,
        query_text=run.raw_text,
        embedding=embedding,
        wrong_payload=wrong_payload,
        corrected_payload=corrected_payload,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    _vector_store.add(row)


def retrieve_corrections(db: Session, *, run: GenerationPipelineRun, stage_name: str) -> list[CorrectionMatch]:
    if not settings.rag_enabled or run.generation_mode != "ollama":
        return []
    embedding = _embed(run.raw_text)
    if embedding is None:
        return []
    return _vector_store.search(
        db,
        workspace_id=run.workspace_id,
        stage_name=stage_name,
        query_embedding=embedding,
        top_k=settings.rag_top_k,
        min_similarity=settings.rag_min_similarity,
    )


def format_corrections_for_prompt(matches: list[CorrectionMatch]) -> list[dict[str, Any]]:
    """Shape corrections for inclusion in the generic upstream JSON blob, so the
    model sees them the same way it sees rawText/previousArtifact/clarificationContext.
    """
    return [
        {
            "similarPastInput": match.query_text,
            "youIncorrectlyProduced": match.wrong_payload,
            "theCorrectAnswerWas": match.corrected_payload,
        }
        for match in matches
    ]
