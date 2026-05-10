"""Backend tests for ResumeAI - covers auth, resumes, uploads, AI, payments, admin."""
import os
import io
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smart-cv-craft-3.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "admin@resumeai.com"
ADMIN_PASS = "Admin@12345"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def user_ctx(s):
    email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "Test@12345", "name": "Test User"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "id": data["id"]}


@pytest.fixture(scope="module")
def admin_ctx():
    sess = requests.Session()
    r = sess.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["role"] == "admin"
    return {"token": d["token"], "session": sess}


def auth_h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Health ----------
def test_health():
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- Auth ----------
def test_register_and_me(user_ctx):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_h(user_ctx["token"]))
    assert r.status_code == 200
    assert r.json()["email"] == user_ctx["email"]
    assert r.json()["role"] == "user"


def test_login_invalid():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "nope@x.com", "password": "wrong"})
    assert r.status_code == 401


def test_admin_login_role(admin_ctx):
    assert admin_ctx["token"]


def test_google_stub():
    em = f"g_{uuid.uuid4().hex[:8]}@gmail.com"
    r = requests.post(f"{BASE_URL}/api/auth/google", json={"email": em, "name": "G User"})
    assert r.status_code == 200
    assert r.json()["email"] == em


def test_logout():
    r = requests.post(f"{BASE_URL}/api/auth/logout")
    assert r.status_code == 200


# ---------- Resumes CRUD ----------
def test_resume_crud(user_ctx):
    h = auth_h(user_ctx["token"])
    # Create
    r = requests.post(f"{BASE_URL}/api/resumes", json={"title": "TEST_R", "template": "modern", "data": {"name": "X"}, "customization": {"color": "#000"}}, headers=h)
    assert r.status_code == 200, r.text
    rid = r.json()["id"]
    assert r.json()["title"] == "TEST_R"

    # List
    r = requests.get(f"{BASE_URL}/api/resumes", headers=h)
    assert r.status_code == 200
    assert any(x["id"] == rid for x in r.json())

    # Get
    r = requests.get(f"{BASE_URL}/api/resumes/{rid}", headers=h)
    assert r.status_code == 200
    assert r.json()["id"] == rid

    # Update
    r = requests.put(f"{BASE_URL}/api/resumes/{rid}", json={"title": "TEST_R2", "template": "classic", "data": {"name": "Y"}, "customization": {}}, headers=h)
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_R2"

    # Verify persistence
    r = requests.get(f"{BASE_URL}/api/resumes/{rid}", headers=h)
    assert r.json()["title"] == "TEST_R2"

    # Public share
    r = requests.get(f"{BASE_URL}/api/resumes/share/{rid}")
    assert r.status_code == 200
    assert "user_id" not in r.json()

    # Delete
    r = requests.delete(f"{BASE_URL}/api/resumes/{rid}", headers=h)
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/api/resumes/{rid}", headers=h)
    assert r.status_code == 404


def test_resume_unauthorized():
    r = requests.get(f"{BASE_URL}/api/resumes")
    assert r.status_code == 401


# ---------- Uploads ----------
def test_upload(user_ctx):
    h = auth_h(user_ctx["token"])
    files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    r = requests.post(f"{BASE_URL}/api/uploads", files=files, headers=h)
    assert r.status_code == 200
    fid = r.json()["id"]
    assert r.json()["url"] == f"/api/uploads/{fid}"
    r = requests.get(f"{BASE_URL}/api/uploads/{fid}")
    assert r.status_code == 200
    assert r.content == b"hello"


# ---------- AI ----------
def test_ai_summary(user_ctx):
    h = auth_h(user_ctx["token"])
    payload = {"provider": "anthropic", "feature": "summary", "context": {"role": "Software Engineer", "experience": "5 years Python"}}
    r = requests.post(f"{BASE_URL}/api/ai", json=payload, headers=h, timeout=90)
    assert r.status_code == 200, r.text
    assert isinstance(r.json().get("result"), str)
    assert len(r.json()["result"]) > 10


def test_ai_ats(user_ctx):
    h = auth_h(user_ctx["token"])
    payload = {"provider": "anthropic", "feature": "ats", "context": {"summary": "Python dev with FastAPI, MongoDB"}, "job_description": "Backend engineer with Python, FastAPI, AWS"}
    r = requests.post(f"{BASE_URL}/api/ai", json=payload, headers=h, timeout=90)
    assert r.status_code == 200, r.text
    txt = r.json()["result"]
    # Should contain JSON-ish content
    assert "score" in txt.lower() or "{" in txt


# ---------- Payments ----------
def test_payment_intent_and_submit(user_ctx):
    h = auth_h(user_ctx["token"])
    r = requests.post(f"{BASE_URL}/api/payments/intent", json={"plan": "pro"}, headers=h)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["amount"] == 199
    assert "order_id" in d and "upi_link" in d
    order_id = d["order_id"]

    r = requests.post(f"{BASE_URL}/api/payments/submit", json={"order_id": order_id, "utr": "TESTUTR123"}, headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "submitted"
    return order_id


# ---------- Admin ----------
def test_admin_endpoints(admin_ctx, user_ctx):
    h = auth_h(admin_ctx["token"])
    # users list
    r = requests.get(f"{BASE_URL}/api/admin/users", headers=h)
    assert r.status_code == 200
    assert any(u["email"] == ADMIN_EMAIL for u in r.json())

    # Create payment as user, approve as admin
    uh = auth_h(user_ctx["token"])
    intent = requests.post(f"{BASE_URL}/api/payments/intent", json={"plan": "pro"}, headers=uh).json()
    oid = intent["order_id"]
    requests.post(f"{BASE_URL}/api/payments/submit", json={"order_id": oid, "utr": "ADMINTEST"}, headers=uh)

    r = requests.get(f"{BASE_URL}/api/admin/payments", headers=h)
    assert r.status_code == 200
    assert any(p["id"] == oid for p in r.json())

    r = requests.post(f"{BASE_URL}/api/admin/payments/{oid}/verify", json={"action": "approve"}, headers=h)
    assert r.status_code == 200

    # Verify user plan upgraded
    me = requests.get(f"{BASE_URL}/api/auth/me", headers=uh).json()
    assert me["plan"] == "pro"
    assert me["premium_unlocked"] is True


def test_admin_forbidden_for_user(user_ctx):
    h = auth_h(user_ctx["token"])
    r = requests.get(f"{BASE_URL}/api/admin/users", headers=h)
    assert r.status_code == 403
    r = requests.get(f"{BASE_URL}/api/admin/payments", headers=h)
    assert r.status_code == 403
