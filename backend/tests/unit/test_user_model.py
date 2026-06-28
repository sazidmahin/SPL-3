from app.db.base import Base
from app.db.models import User


def test_user_model_matches_ticket_006_and_platform_role_contract() -> None:
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
        "platform_role",
        "is_platform_admin",
        "created_at",
        "updated_at",
    }
    assert table.c.email.unique is True
    assert table.c.status.default.arg == "active"
    assert table.c.platform_role.default.arg == "user"
    assert table.c.is_platform_admin.default.arg is False
    assert table.c.avatar_url.nullable is True
