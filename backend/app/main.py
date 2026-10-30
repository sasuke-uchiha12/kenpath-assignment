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
        return {'applications':[case_dict(a) for a in rows]}

from datetime import datetime, timezone
from typing import Literal
from pydantic import Field, field_validator
from sqlalchemy import update
from .models import Document, Decision, AIReview

class DecisionInput(BaseModel):
    action: Literal['approved','rejected','returned']
    reason: str = Field(min_length=1, max_length=2000)
    language: Literal['en','ta']
    expected_revision: int = Field(ge=0)

    @field_validator('reason')
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError('reason_required')
        return value.strip()

def case_dict(a):
    submitted = a.submitted if a.submitted.tzinfo else a.submitted.replace(tzinfo=timezone.utc)
    age = max(0, (datetime.now(timezone.utc) - submitted).days)
    return {'id':a.id,'reference':a.reference,'applicant':a.applicant,'district':a.district,'address':a.address,'occupation':a.occupation,'submitted':submitted.isoformat(),'status':a.status,'annual_income':a.annual_income,'attention':a.attention,'revision':a.revision,'age':age,'overdue':a.status == 'pending' and age >= 15,'required_documents':a.required_documents}

@app.get('/api/applications/{case_id}')
def case_detail(case_id: int, username: str = Depends(officer)):
    with db.Session() as session:
        a = session.get(Application, case_id)
        if not a:
            raise HTTPException(404, 'case_not_found')
        docs = session.scalars(select(Document).where(Document.application_id == case_id).order_by(Document.id)).all()
        review = session.scalar(select(AIReview).where(AIReview.application_id == case_id))
        decision = session.scalar(select(Decision).where(Decision.application_id == case_id))
        result = case_dict(a)
        result['documents'] = [{'id':d.id,'kind':d.kind,'title':d.title,'content':d.content} for d in docs]
        result['ai_review'] = {'output':review.output,'model':review.model,'created_at':review.created_at.isoformat()} if review else None
        result['decision'] = {'action':decision.action,'reason':decision.reason,'language':decision.language,'officer':decision.officer,'created_at':decision.created_at.isoformat()} if decision else None
        return result

@app.post('/api/applications/{case_id}/decision')
def make_decision(case_id: int, payload: DecisionInput, username: str = Depends(officer)):
    with db.Session() as session:
        if not session.get(Application, case_id):
            raise HTTPException(404, 'case_not_found')
        result = session.execute(update(Application).where(Application.id==case_id, Application.status=='pending', Application.revision==payload.expected_revision).values(status=payload.action, revision=Application.revision+1))
        if result.rowcount != 1:
            session.rollback()
            raise HTTPException(409, 'case_changed')
        session.add(Decision(application_id=case_id,action=payload.action,reason=payload.reason,language=payload.language,officer=username))
        session.commit()
        return {'status':payload.action,'revision':payload.expected_revision+1}

@app.get('/api/decisions')
def decision_history(username: str = Depends(officer)):
    with db.Session() as session:
        rows = session.execute(select(Decision,Application).join(Application,Decision.application_id==Application.id).order_by(Decision.created_at.desc())).all()
        return [{'id':d.id,'application_id':a.id,'reference':a.reference,'applicant':a.applicant,'action':d.action,'reason':d.reason,'language':d.language,'officer':d.officer,'created_at':d.created_at.isoformat()} for d,a in rows]
