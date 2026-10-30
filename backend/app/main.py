import hmac
import os
from collections import defaultdict, deque
from time import monotonic
from urllib.parse import urlsplit
from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import select
from . import db
from .models import Application
from .passwords import verify_password

app = FastAPI(title='Certificate Desk')
app.add_middleware(SessionMiddleware, secret_key=os.getenv('SESSION_SECRET', 'local-development-only-change-me'), same_site='lax', https_only=os.getenv('COOKIE_SECURE', 'false').lower() == 'true', max_age=28800)
attempts = defaultdict(deque)

@app.middleware('http')
async def same_origin(request: Request, call_next):
    origin = request.headers.get('origin')
    if request.method in ('POST', 'PUT', 'PATCH', 'DELETE') and origin:
        expected = os.getenv('APP_ORIGIN', str(request.base_url).rstrip('/'))
        if origin.rstrip('/') != expected.rstrip('/'):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={'detail':'invalid_origin'})
    return await call_next(request)

class Login(BaseModel):
    username: str
    password: str

def officer(request: Request):
    username = request.session.get('officer')
    if not username:
        raise HTTPException(401, 'not_authenticated')
    return username

@app.get('/api/health')
def health():
    return {'status':'ok'}

@app.post('/api/auth/login')
def login(payload: Login, request: Request):
    key = request.client.host if request.client else 'unknown'
    now = monotonic()
    recent = attempts[key]
    while recent and now-recent[0] > 60:
        recent.popleft()
    if len(recent) >= 10:
        raise HTTPException(429, 'login_rate_limited')
    username = os.getenv('OFFICER_USERNAME', '')
    password_hash = os.getenv('OFFICER_PASSWORD_HASH', '')
    if not username or not password_hash or not hmac.compare_digest(payload.username, username) or not verify_password(payload.password, password_hash):
        recent.append(now)
        raise HTTPException(401, 'invalid_credentials')
    recent.clear()
    request.session.clear()
    request.session['officer'] = username
    return {'username': username}

@app.get('/api/auth/me')
def me(username: str = Depends(officer)):
    return {'username':username}

@app.post('/api/auth/logout')
def logout(request: Request):
    request.session.clear()
    return {'ok':True}

@app.get('/api/applications')
def applications(username: str = Depends(officer)):
    with db.Session() as session:
        rows = session.scalars(select(Application).order_by(Application.submitted)).all()
        return {'applications':[{'id':a.id,'reference':a.reference,'applicant':a.applicant,'district':a.district,'submitted':a.submitted.isoformat(),'status':a.status,'annual_income':a.annual_income,'attention':a.attention,'revision':a.revision} for a in rows]}
