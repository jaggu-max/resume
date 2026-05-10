from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import bcrypt
import jwt
import base64
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import Response as FastResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
UPI_ID = os.environ.get('UPI_ID', '')
UPI_NAME = os.environ.get('UPI_NAME', 'ResumeAI')

app = FastAPI(title="ResumeAI API")
api = APIRouter(prefix="/api")
logger = logging.getLogger("resumeai")
logging.basicConfig(level=logging.INFO)

# ---------- Helpers ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str, role: str, kind: str = "access") -> str:
    delta = timedelta(minutes=60*24*7) if kind == "access" else timedelta(days=30)
    payload = {"sub": user_id, "email": email, "role": role, "type": kind,
               "exp": datetime.now(timezone.utc) + delta}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def set_auth_cookies(resp: Response, access: str, refresh: str):
    resp.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=60*60*24*7, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=60*60*24*30, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        h = request.headers.get("Authorization", "")
        if h.startswith("Bearer "):
            token = h[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ResumeIn(BaseModel):
    title: str = "Untitled Resume"
    template: str = "modern"
    data: Dict[str, Any] = {}
    customization: Dict[str, Any] = {}

class AIRequest(BaseModel):
    provider: str = "openai"  # default GPT-5 for cost efficiency
    feature: str  # summary, improve, ats, skills, grammar, keywords, chat
    context: Any = None  # accepts dict OR pre-stringified JSON
    job_description: Optional[str] = None
    text: Optional[str] = None
    selected_text: Optional[str] = None
    mode: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None  # for chatbot

class PaymentIn(BaseModel):
    plan: str  # pro, premium
    amount: float
    utr: str
    screenshot_id: Optional[str] = None

# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid, "email": email, "name": body.name,
        "password_hash": hash_password(body.password),
        "role": "user", "plan": "free",
        "premium_unlocked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_token(uid, email, "user")
    refresh = create_token(uid, email, "user", "refresh")
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": body.name, "role": "user", "plan": "free", "premium_unlocked": False, "token": access}

@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_token(user["id"], email, user.get("role", "user"))
    refresh = create_token(user["id"], email, user.get("role", "user"), "refresh")
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": email, "name": user.get("name"), "role": user.get("role", "user"),
            "plan": user.get("plan", "free"), "premium_unlocked": user.get("premium_unlocked", False), "token": access}

@api.post("/auth/google")
async def google_login(body: dict, response: Response):
    # Simple Google sign-in stub: accepts {email, name, google_id}
    email = (body.get("email") or "").lower()
    name = body.get("name") or "Google User"
    if not email:
        raise HTTPException(status_code=400, detail="email required")
    user = await db.users.find_one({"email": email})
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "email": email, "name": name,
            "password_hash": hash_password(uuid.uuid4().hex),
            "role": "user", "plan": "free", "premium_unlocked": False,
            "google": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    access = create_token(user["id"], email, user.get("role", "user"))
    refresh = create_token(user["id"], email, user.get("role", "user"), "refresh")
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": email, "name": user.get("name"), "role": user.get("role", "user"),
            "plan": user.get("plan", "free"), "premium_unlocked": user.get("premium_unlocked", False), "token": access}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---------- Resumes ----------
@api.get("/resumes")
async def list_resumes(user: dict = Depends(get_current_user)):
    items = await db.resumes.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return items

@api.post("/resumes")
async def create_resume(body: ResumeIn, user: dict = Depends(get_current_user)):
    rid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": rid, "user_id": user["id"], "title": body.title, "template": body.template,
           "data": body.data, "customization": body.customization, "created_at": now, "updated_at": now}
    await db.resumes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/resumes/{rid}")
async def get_resume(rid: str, user: dict = Depends(get_current_user)):
    r = await db.resumes.find_one({"id": rid, "user_id": user["id"]}, {"_id": 0})
    if not r:
        raise HTTPException(404, "Not found")
    return r

@api.put("/resumes/{rid}")
async def update_resume(rid: str, body: ResumeIn, user: dict = Depends(get_current_user)):
    res = await db.resumes.update_one(
        {"id": rid, "user_id": user["id"]},
        {"$set": {"title": body.title, "template": body.template, "data": body.data,
                  "customization": body.customization, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    r = await db.resumes.find_one({"id": rid}, {"_id": 0})
    return r

@api.delete("/resumes/{rid}")
async def delete_resume(rid: str, user: dict = Depends(get_current_user)):
    await db.resumes.delete_one({"id": rid, "user_id": user["id"]})
    return {"ok": True}

@api.get("/resumes/share/{rid}")
async def share_resume(rid: str):
    r = await db.resumes.find_one({"id": rid}, {"_id": 0, "user_id": 0})
    if not r:
        raise HTTPException(404, "Not found")
    return r

# ---------- Uploads (base64 in mongo) ----------
@api.post("/uploads")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 5MB)")
    fid = str(uuid.uuid4())
    await db.uploads.insert_one({
        "id": fid, "user_id": user["id"],
        "filename": file.filename, "content_type": file.content_type or "application/octet-stream",
        "data_b64": base64.b64encode(content).decode(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": fid, "url": f"/api/uploads/{fid}"}

@api.get("/uploads/{fid}")
async def get_upload(fid: str):
    f = await db.uploads.find_one({"id": fid}, {"_id": 0})
    if not f:
        raise HTTPException(404, "Not found")
    return FastResponse(content=base64.b64decode(f["data_b64"]), media_type=f["content_type"])

# ---------- AI ----------
def get_ai_prompt(feature: str, ctx: Any, jd: Optional[str], text: Optional[str], selected: Optional[str] = None) -> tuple[str, str]:
    sys = "You are an elite resume coach and ATS expert. Be concise, professional, and impactful."
    ctx_str = ctx if isinstance(ctx, str) else (str(ctx) if ctx else "")
    use_text = selected or text or ""
    if feature == "summary":
        prompt = f"Write a 3-4 sentence professional resume summary for this candidate. Be specific, results-oriented, and ATS-friendly. Return ONLY the summary text, no preamble.\n\nCandidate info:\n{ctx_str}"
    elif feature == "improve":
        prompt = f"Rewrite this resume bullet/section to be more impactful, action-oriented, and ATS-friendly. Use strong verbs and quantify when possible. Return ONLY the improved text.\n\nText:\n{use_text}"
    elif feature == "ats":
        prompt = (
            "Analyze the resume against the job description. Return a strict JSON object with keys: "
            "score (0-100 integer), matched_keywords (array of strings), missing_keywords (array of strings), "
            "suggestions (array of 3-5 short string tips). Return ONLY the JSON, no markdown.\n\n"
            f"RESUME:\n{ctx_str}\n\nJOB DESCRIPTION:\n{jd or 'General software/professional role'}"
        )
    elif feature == "skills":
        prompt = f"Suggest 10 highly relevant, ATS-friendly skills for this candidate based on their experience. Return as a comma-separated list only, no numbering, no preamble.\n\nProfile:\n{ctx_str}"
    elif feature == "grammar":
        prompt = f"Fix grammar, spelling, and improve clarity. Keep the meaning intact. Return ONLY the corrected text.\n\nText:\n{use_text}"
    elif feature == "keywords":
        prompt = f"Extract 12 ATS-optimized keywords this resume should include for the target role. Return comma-separated only.\n\nResume:\n{ctx_str}\n\nRole/JD:\n{jd or 'general'}"
    elif feature == "chat":
        sys = ("You are ResumeAI Assistant — a helpful career coach inside the ResumeAI app. "
               "Help users with resume guidance, ATS suggestions, interview preparation, skill recommendations, and resume improvement tips. "
               "Keep replies concise, friendly, and actionable. "
               "If the user asks who built this app, who created this, who made this app, who is the developer, "
               "or any similar question, ALWAYS answer exactly: 'This ResumeAI platform was built by Jagadeesh S Bentoor.'")
        prompt = use_text or "Hi"
    else:
        prompt = use_text or "Help me with my resume."
    return sys, prompt

@api.post("/ai")
async def ai_generate(body: AIRequest, user: dict = Depends(get_current_user)):
    sys, prompt = get_ai_prompt(body.feature, body.context, body.job_description, body.text, body.selected_text)
    logger.info(f"[AI] user={user.get('email')} feature={body.feature} provider={body.provider} promptLen={len(prompt)}")
    last_err = None
    for attempt in range(2):  # simple retry
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"{user['id']}-{body.feature}", system_message=sys)
            if body.provider == "anthropic":
                chat = chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            else:
                chat = chat.with_model("openai", "gpt-5.1")
            # for chatbot, prepend recent history into the prompt to keep context simple
            if body.feature == "chat" and body.history:
                hist = "\n".join([f"{m.get('role','user').upper()}: {m.get('content','')}" for m in body.history[-6:]])
                prompt_full = f"Conversation so far:\n{hist}\n\nUSER: {prompt}\nASSISTANT:"
            else:
                prompt_full = prompt
            resp = await chat.send_message(UserMessage(text=prompt_full))
            return {"result": str(resp).strip(), "feature": body.feature, "provider": body.provider}
        except Exception as e:
            last_err = e
            logger.warning(f"[AI] attempt {attempt+1} failed: {e}")
    logger.exception("AI failed after retries")
    raise HTTPException(500, f"AI error: {str(last_err)[:200] if last_err else 'unknown'}")

# ---------- Payments ----------
@api.get("/payments/info")
async def payment_info(user: dict = Depends(get_current_user)):
    # Don't expose UPI ID publicly per requirements
    return {"upi_name": UPI_NAME, "plans": {
        "pro": {"name": "Pro", "price": 199, "features": ["All 9 templates", "AI features unlimited", "PDF/DOCX downloads", "ATS Score Checker"]},
        "premium": {"name": "Premium", "price": 499, "features": ["Everything in Pro", "Priority AI", "Premium templates", "Custom branding", "Priority support"]},
    }}

@api.post("/payments/intent")
async def payment_intent(body: dict, user: dict = Depends(get_current_user)):
    plan = body.get("plan", "pro")
    amount = 199 if plan == "pro" else 499
    order_id = f"OR{uuid.uuid4().hex[:10].upper()}"
    note = f"ResumeAI {plan.upper()} {order_id}"
    upi_link = f"upi://pay?pa={UPI_ID}&pn={UPI_NAME.replace(' ', '%20')}&am={amount}&cu=INR&tn={note}"
    await db.payments.insert_one({
        "id": order_id, "user_id": user["id"], "plan": plan, "amount": amount,
        "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"order_id": order_id, "amount": amount, "upi_link": upi_link, "note": note}

@api.post("/payments/submit")
async def payment_submit(body: dict, user: dict = Depends(get_current_user)):
    order_id = body.get("order_id")
    utr = body.get("utr", "").strip()
    screenshot_id = body.get("screenshot_id")
    if not order_id or not utr:
        raise HTTPException(400, "order_id and utr required")
    res = await db.payments.update_one(
        {"id": order_id, "user_id": user["id"]},
        {"$set": {"utr": utr, "screenshot_id": screenshot_id, "status": "submitted",
                  "submitted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return {"ok": True, "status": "submitted"}

@api.get("/payments/mine")
async def my_payments(user: dict = Depends(get_current_user)):
    items = await db.payments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

# ---------- Admin ----------
@api.get("/admin/users")
async def admin_users(_: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api.get("/admin/payments")
async def admin_payments(_: dict = Depends(require_admin)):
    pays = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # hydrate user
    for p in pays:
        u = await db.users.find_one({"id": p.get("user_id")}, {"_id": 0, "email": 1, "name": 1})
        if u:
            p["user"] = u
    return pays

@api.post("/admin/payments/{order_id}/verify")
async def admin_verify(order_id: str, body: dict, _: dict = Depends(require_admin)):
    action = body.get("action")  # approve | reject
    pay = await db.payments.find_one({"id": order_id}, {"_id": 0})
    if not pay:
        raise HTTPException(404, "Not found")
    if action == "approve":
        await db.payments.update_one({"id": order_id}, {"$set": {"status": "approved", "verified_at": datetime.now(timezone.utc).isoformat()}})
        await db.users.update_one({"id": pay["user_id"]}, {"$set": {"plan": pay["plan"], "premium_unlocked": True}})
    elif action == "reject":
        await db.payments.update_one({"id": order_id}, {"$set": {"status": "rejected", "verified_at": datetime.now(timezone.utc).isoformat()}})
    else:
        raise HTTPException(400, "action must be approve|reject")
    return {"ok": True}

# ---------- Health ----------
@api.get("/")
async def root():
    return {"message": "ResumeAI API running"}

# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.resumes.create_index("user_id")
    await db.payments.create_index("user_id")
    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@resumeai.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email, "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin", "plan": "premium", "premium_unlocked": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
