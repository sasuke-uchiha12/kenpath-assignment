import asyncio
import httpx


def test_officer_login_and_protected_cases(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{tmp_path / "test.db"}')
    monkeypatch.setenv('SESSION_SECRET', 'a-long-test-session-secret')
    monkeypatch.setenv('OFFICER_USERNAME', 'officer')
    from app.passwords import hash_password
    monkeypatch.setenv('OFFICER_PASSWORD_HASH', hash_password('test-password'))
    from app import db, main, seed
    db.Base.metadata.create_all(db.engine)
    seed.seed()
    seed.seed()
    async def exercise():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url='http://test') as client:
            assert (await client.get('/api/applications')).status_code == 401
            assert (await client.post('/api/auth/login', json={'username':'officer','password':'wrong'})).status_code == 401
            assert (await client.post('/api/auth/login', json={'username':'officer','password':'test-password'})).status_code == 200
            response = await client.get('/api/applications')
            assert response.status_code == 200
            assert len(response.json()['applications']) == 12
            assert (await client.post('/api/auth/logout')).status_code == 200
            assert (await client.get('/api/applications')).status_code == 401
    asyncio.run(exercise())
