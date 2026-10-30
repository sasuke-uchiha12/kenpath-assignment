import asyncio
import httpx


def test_officer_login_and_protected_cases(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("SESSION_SECRET", "a-long-test-session-secret")
    monkeypatch.setenv("OFFICER_USERNAME", "officer")
    from app.passwords import hash_password

    monkeypatch.setenv("OFFICER_PASSWORD_HASH", hash_password("test-password"))
    from app import db, main, seed

    db.Base.metadata.create_all(db.engine)
    seed.seed()
    seed.seed()

    async def exercise():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=main.app), base_url="http://test"
        ) as client:
            assert (await client.get("/api/applications")).status_code == 401
            assert (
                (await client.get("/")).headers["content-type"].startswith("text/html")
            )
            assert (
                (await client.get("/history"))
                .headers["content-type"]
                .startswith("text/html")
            )
            assert (await client.get("/api/missing")).status_code == 404
            assert (await client.get("/assets/missing.js")).status_code == 404
            assert (
                await client.post(
                    "/api/auth/login",
                    headers={"origin": "https://untrusted.example"},
                    json={"username": "officer", "password": "test-password"},
                )
            ).status_code == 403
            assert (
                await client.post(
                    "/api/auth/login", json={"username": "officer", "password": "wrong"}
                )
            ).status_code == 401
            assert (
                await client.post(
                    "/api/auth/login",
                    json={"username": "officer", "password": "test-password"},
                )
            ).status_code == 200
            response = await client.get("/api/applications")
            assert response.status_code == 200
            assert len(response.json()["applications"]) == 12
            assert (
                await client.post("/api/applications/2/ai-review")
            ).status_code == 503
            from app import ai

            valid = {
                "suggested_action": "returned",
                "evidence_ids": [20, 21],
                "en": {
                    "summary": "Income evidence missing",
                    "missing_documents": ["Income evidence"],
                    "inconsistencies": [],
                    "reasons": ["Please provide evidence"],
                    "questions": [],
                },
                "ta": {
                    "summary": "வருமானச் சான்று இல்லை",
                    "missing_documents": ["வருமானச் சான்று"],
                    "inconsistencies": [],
                    "reasons": ["சான்றை வழங்கவும்"],
                    "questions": [],
                },
            }
            monkeypatch.setattr(ai, "generate", lambda evidence: valid)
            monkeypatch.setenv("GEMINI_API_KEY", "test-only")
            review = await client.post("/api/applications/2/ai-review")
            assert review.status_code == 200
            assert review.json()["output"]["en"]["summary"] == "Income evidence missing"
            monkeypatch.setattr(
                ai,
                "generate",
                lambda evidence: (_ for _ in ()).throw(
                    RuntimeError("should use cache")
                ),
            )
            assert (
                await client.post("/api/applications/2/ai-review")
            ).status_code == 200
            monkeypatch.setattr(
                ai, "generate", lambda evidence: {**valid, "evidence_ids": [999]}
            )
            assert (
                await client.post("/api/applications/3/ai-review")
            ).status_code == 503

            class ProviderError(Exception):
                code = 400

            def reject_request(evidence):
                raise ProviderError("private upstream message")

            monkeypatch.setattr(ai, "generate", reject_request)
            failed = await client.post("/api/applications/4/ai-review")
            assert failed.status_code == 503
            assert failed.json()["detail"] == "ai_provider_request_error"
            assert "private upstream message" not in failed.text
            detail = await client.get("/api/applications/1")
            assert detail.status_code == 200
            assert len(detail.json()["documents"]) == 3
            assert "கற்பனை" in detail.json()["documents"][0]["content_ta"]
            invalid = await client.post(
                "/api/applications/1/decision",
                json={
                    "action": "approved",
                    "reason": "",
                    "language": "en",
                    "expected_revision": 0,
                },
            )
            assert invalid.status_code == 422
            decision = await client.post(
                "/api/applications/1/decision",
                json={
                    "action": "returned",
                    "reason": "Please clarify income",
                    "language": "en",
                    "expected_revision": 0,
                },
            )
            assert decision.status_code == 200
            again = await client.post(
                "/api/applications/1/decision",
                json={
                    "action": "approved",
                    "reason": "Reviewed",
                    "language": "en",
                    "expected_revision": 0,
                },
            )
            assert again.status_code == 409
            assert (await client.get("/api/applications/1")).json()[
                "status"
            ] == "returned"
            seed.seed()
            assert (await client.get("/api/applications/1")).json()[
                "status"
            ] == "returned"
            assert len((await client.get("/api/decisions")).json()) == 1
            assert (await client.post("/api/auth/logout")).status_code == 200
            assert (await client.get("/api/applications")).status_code == 401

    asyncio.run(exercise())
