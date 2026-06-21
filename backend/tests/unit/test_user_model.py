from app.db.base import Base
from app.db.models import User


def test_user_model_matches_ticket_006_contract() -> None:
    table = User.__table__

    assert table.name == "users"
    assert table is Base.metadata.tables["users"]
    assert set(table.columns.keys()) == {
        "id",
        "email",
        "password_hash",
        "full_name",
        "avatar_url",
        "status",
        "created_at",
        "updated_at",
    }
    assert table.c.email.unique is True
    assert table.c.status.default.arg == "active"
    assert table.c.avatar_url.nullable is True
