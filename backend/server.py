from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import random
import string
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
import base64
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("testseries")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

app = FastAPI(title="TestSeries API")
api = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class CustomerOTPRequest(BaseModel):
    phone: str
    name: Optional[str] = None


class CustomerOTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    password: Optional[str] = None


class CustomerPasswordLogin(BaseModel):
    phone: str
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class ProductIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    category: str
    price: float
    mrp: Optional[float] = None
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    images: List[str] = Field(default_factory=list)
    stock: int = 100
    hidden: bool = False
    tags: List[str] = Field(default_factory=list)  # best-seller, new, featured
    default_discount: float = 0  # default ₹ off for codes


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    stock: Optional[int] = None
    hidden: Optional[bool] = None
    tags: Optional[List[str]] = None
    default_discount: Optional[float] = None


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image_url: Optional[str] = ""


class AddressIn(BaseModel):
    full_name: str
    phone: str
    address_line: str
    city: str
    state: str
    pincode: str


class OrderCreate(BaseModel):
    items: List[OrderItem]
    address: AddressIn
    payment_method: str  # cod | upi | razorpay
    discount_code: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # pending | confirmed | shipped | delivered | cancelled


class DiscountCodeIn(BaseModel):
    one_time: bool = True
    product_discounts: dict[str, float] = Field(default_factory=dict)  # product_id -> ₹ off (per line)


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
SEED_PRODUCTS = [
    {"name": "Spark 200 Pages Notebook Bundle - Pack of 6", "category": "Stationery", "price": 310, "mrp": 420,
     "image_url": "https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["best-seller"]},
    {"name": "Forever 200 Pages Notebook Bundle - Pack of 3", "category": "Stationery", "price": 180, "mrp": 260,
     "image_url": "https://images.unsplash.com/photo-1512279093314-5926a353720c?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": []},
    {"name": "Forever 200 Pages Notebook Bundle - Pack of 6", "category": "Stationery", "price": 320, "mrp": 510,
     "image_url": "https://images.unsplash.com/photo-1647559709298-c0e3dcb47092?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["new"]},
    {"name": "Motivational Plastic Water Bottle 1 Litre", "category": "Bottle", "price": 110, "mrp": 160,
     "image_url": "https://images.unsplash.com/photo-1566557087503-b839ce6e5aa0?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["best-seller"]},
    {"name": "400 Pages Notebook Bundle - Pack of 2", "category": "Stationery", "price": 250, "mrp": None,
     "image_url": "https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": []},
    {"name": "LCD Writing Tablet 12 inch", "category": "Tablet", "price": 120, "mrp": 200,
     "image_url": "https://images.unsplash.com/photo-1649331593153-7575e5cd3c6e?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["featured", "best-seller"]},
    {"name": "LCD Writing Compass Box", "category": "Geometry", "price": 140, "mrp": 180,
     "image_url": "https://images.unsplash.com/photo-1764948620467-2b08f6843dd6?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["new"]},
    {"name": "Temperature Water Bottle 500ml", "category": "Bottle", "price": 165, "mrp": 180,
     "image_url": "https://images.unsplash.com/photo-1620911626955-c6227a886383?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["featured"]},
    {"name": "Spark 200 Pages Notebook Bundle - Pack of 3", "category": "Stationery", "price": 165, "mrp": 210,
     "image_url": "https://images.unsplash.com/photo-1512279093314-5926a353720c?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": []},
    {"name": "300 Pages Notebook Bundle - Pack of 3", "category": "Stationery", "price": 165, "mrp": 450,
     "image_url": "https://images.unsplash.com/photo-1647559709298-c0e3dcb47092?crop=entropy&cs=srgb&fm=jpg&w=940&q=80",
     "tags": ["best-seller"]},
]


async def seed():
    # Indexes
    await db.users.create_index("phone")
    await db.users.create_index("email")
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.discount_codes.create_index("code", unique=True)
    await db.otps.create_index("expires_at", expireAfterSeconds=0)
    await db.otp_requests.create_index("created_at")
    await db.login_attempts.create_index("identifier")

    # Admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Ayzal Khan",
            "role": "admin",
            "password_hash": hash_password(admin_password),
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")

    # Products
    if await db.products.count_documents({}) == 0:
        for p in SEED_PRODUCTS:
            doc = {
                "id": str(uuid.uuid4()),
                "name": p["name"],
                "category": p["category"],
                "price": p["price"],
                "mrp": p.get("mrp"),
                "description": f"{p['name']} - premium quality, made for Indian students.",
                "image_url": p["image_url"],
                "stock": 50,
                "hidden": False,
                "tags": p.get("tags", []),
                "created_at": now_iso(),
            }
            await db.products.insert_one(doc)
        logger.info("Seeded %d products", len(SEED_PRODUCTS))


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@api.post("/auth/customer/request-otp")
async def request_otp(payload: CustomerOTPRequest, request: Request):
    phone = payload.phone.strip()
    if not phone.isdigit() or len(phone) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number (must be 10 digits)")

    # Rate limit: max 3 OTP requests per phone in 10 minutes
    ten_min_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent = await db.otp_requests.count_documents({
        "phone": phone,
        "created_at": {"$gte": ten_min_ago.isoformat()},
    })
    if recent >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Try again later.")
    await db.otp_requests.insert_one({"phone": phone, "created_at": now_iso()})

    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.otps.update_one(
        {"phone": phone},
        {"$set": {"phone": phone, "otp": otp, "expires_at": expires_at, "created_at": now_iso()}},
        upsert=True,
    )
    logger.info("MOCK OTP for %s: %s", phone, otp)
    # MOCK: return OTP in response for development (set EXPOSE_OTP=false to hide)
    expose = os.environ.get("EXPOSE_OTP", "true").lower() == "true"
    resp = {"success": True, "message": "OTP sent (mock). Use it to verify.", "mock": True}
    if expose:
        resp["otp"] = otp
    return resp


@api.post("/auth/admin/login")
async def admin_login(payload: AdminLogin, request: Request):
    email = payload.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    # Brute force lockout: 5 failed attempts in 15 min = locked for 15 min
    fifteen_min_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
    attempts_doc = await db.login_attempts.find_one({"identifier": identifier})
    if attempts_doc:
        recent_fails = [t for t in attempts_doc.get("failures", []) if t >= fifteen_min_ago.isoformat()]
        if len(recent_fails) >= 5:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    valid = user and user.get("role") == "admin" and verify_password(payload.password, user.get("password_hash", ""))
    if not valid:
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$push": {"failures": now_iso()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Success: clear failures
    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_token(user["id"], "admin")
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": "admin"},
    }


@api.post("/auth/customer/verify-otp")
async def verify_otp(payload: CustomerOTPVerify):
    phone = payload.phone.strip()
    record = await db.otps.find_one({"phone": phone})
    if not record:
        raise HTTPException(status_code=400, detail="OTP not requested")
    if record["otp"] != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP")

    exp = record["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(status_code=400, detail="OTP expired")

    user = await db.users.find_one({"phone": phone})
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "name": payload.name or f"Student {phone[-4:]}",
            "role": "customer",
            "created_at": now_iso(),
        }
        await db.users.insert_one(user)
    if payload.password and len(payload.password) >= 6:
        await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(payload.password)}})

    await db.otps.delete_one({"phone": phone})
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "phone": user["phone"], "name": user["name"], "role": user["role"]},
    }


@api.post("/auth/admin/login")
async def admin_login(payload: AdminLogin, request: Request):
    email = payload.email.lower().strip()
    identifier = f"admin:{email}"  # email-only key (works behind load balancers)

    # Brute force lockout: 5 failed attempts in 15 min = locked for 15 min
    fifteen_min_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
    attempts_doc = await db.login_attempts.find_one({"identifier": identifier})
    if attempts_doc:
        recent_fails = [t for t in attempts_doc.get("failures", []) if t >= fifteen_min_ago.isoformat()]
        if len(recent_fails) >= 5:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    valid = user and user.get("role") == "admin" and verify_password(payload.password, user.get("password_hash", ""))
    if not valid:
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$push": {"failures": now_iso()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Success: clear failures
    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_token(user["id"], "admin")
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": "admin"},
    }


@api.post("/auth/admin/login_DEPRECATED_REMOVED")
async def _unused(payload: AdminLogin):
    raise HTTPException(404)


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@api.get("/products")
async def list_products(category: Optional[str] = None, search: Optional[str] = None, include_hidden: bool = False):
    q: dict = {}
    if not include_hidden:
        q["hidden"] = False
    if category and category.lower() != "all":
        q["category"] = category
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    items = await db.products.find(q, {"_id": 0}).to_list(500)
    return items


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@api.post("/admin/products")
async def create_product(payload: ProductIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/admin/products/{product_id}")
async def update_product(product_id: str, payload: ProductUpdate, _: dict = Depends(require_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.products.update_one({"id": product_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    return p


@api.post("/admin/products/{product_id}/images")
async def upload_product_image(product_id: str, file: UploadFile = File(...), _: dict = Depends(require_admin)):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only JPG/PNG/WEBP allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 5MB per image")
    data_url = f"data:{file.content_type};base64,{base64.b64encode(data).decode()}"
    p = await db.products.find_one({"id": product_id})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    images = p.get("images") or ([p["image_url"]] if p.get("image_url") else [])
    if len(images) >= 8:
        raise HTTPException(status_code=400, detail="Max 8 images per product")
    images.append(data_url)
    update = {"images": images}
    if not p.get("image_url"):
        update["image_url"] = images[0]
    await db.products.update_one({"id": product_id}, {"$set": update})
    return {"images": images}


@api.delete("/admin/products/{product_id}/images/{idx}")
async def delete_product_image(product_id: str, idx: int, _: dict = Depends(require_admin)):
    p = await db.products.find_one({"id": product_id})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    images = p.get("images") or ([p["image_url"]] if p.get("image_url") else [])
    if idx < 0 or idx >= len(images):
        raise HTTPException(status_code=400, detail="Invalid index")
    images.pop(idx)
    update = {"images": images, "image_url": images[0] if images else ""}
    await db.products.update_one({"id": product_id}, {"$set": update})
    return {"images": images}


@api.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(require_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}


@api.get("/admin/products")
async def admin_list_products(_: dict = Depends(require_admin)):
    items = await db.products.find({}, {"_id": 0}).to_list(1000)
    return items


# ---------------------------------------------------------------------------
# Discount Codes
# ---------------------------------------------------------------------------
@api.get("/admin/codes")
async def list_codes(_: dict = Depends(require_admin)):
    items = await db.discount_codes.find({}, {"_id": 0}).to_list(500)
    return items


def _generate_code_block(n: int = 4) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=n))


def generate_access_code() -> str:
    """Generate a 12-char code in XXXX-XXXX-XXXX format."""
    return f"{_generate_code_block()}-{_generate_code_block()}-{_generate_code_block()}"


@api.post("/admin/codes")
async def create_code(payload: DiscountCodeIn, _: dict = Depends(require_admin)):
    # Allow empty product_discounts (access-only code, no discount)
    pd = {pid: float(amt) for pid, amt in payload.product_discounts.items() if amt and amt > 0}
    # Auto-generate unique XXXX-XXXX-XXXX code
    code = generate_access_code()
    for _attempt in range(5):
        if not await db.discount_codes.find_one({"code": code}):
            break
        code = generate_access_code()
    else:
        raise HTTPException(status_code=500, detail="Could not generate unique code")

    doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "product_discounts": pd,
        "one_time": payload.one_time,
        "used": False,
        "used_by": None,
        "used_at": None,
        "created_at": now_iso(),
    }
    await db.discount_codes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/admin/codes/{code_id}")
async def delete_code(code_id: str, _: dict = Depends(require_admin)):
    res = await db.discount_codes.delete_one({"id": code_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"success": True}


@api.post("/codes/validate")
async def validate_code(code: str):
    code = code.strip().upper()
    doc = await db.discount_codes.find_one({"code": code}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invalid code")
    if doc.get("one_time") and doc.get("used"):
        raise HTTPException(status_code=400, detail="Code already used")
    return {
        "code": doc["code"],
        "product_discounts": doc.get("product_discounts", {}),
        "one_time": doc["one_time"],
    }


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
async def log_fraud(user_id: str, kind: str, detail: dict):
    await db.fraud_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "kind": kind,
        "detail": detail,
        "created_at": now_iso(),
    })


@api.post("/orders")
async def create_order(payload: OrderCreate, user: dict = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    if not payload.discount_code or not payload.discount_code.strip():
        await log_fraud(user["id"], "missing_code", {"items": len(payload.items)})
        raise HTTPException(status_code=400, detail="Access code is required to place an order")

    # SECURITY: NEVER trust client-supplied prices. Re-fetch every product from DB.
    trusted_items = []
    subtotal = 0.0
    for i in payload.items:
        if i.quantity <= 0 or i.quantity > 50:
            await log_fraud(user["id"], "bad_quantity", {"product_id": i.product_id, "qty": i.quantity})
            raise HTTPException(status_code=400, detail=f"Invalid quantity for {i.product_id}")
        prod = await db.products.find_one({"id": i.product_id}, {"_id": 0})
        if not prod or prod.get("hidden"):
            await log_fraud(user["id"], "unavailable_product", {"product_id": i.product_id})
            raise HTTPException(status_code=400, detail=f"Product unavailable: {i.product_id}")
        if prod.get("stock", 0) < i.quantity:
            await log_fraud(user["id"], "stock_exceeded", {"product_id": i.product_id, "qty": i.quantity, "stock": prod.get("stock", 0)})
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {prod['name']}")
        # Detect price tampering (informational; we still use server price)
        if abs(float(i.price) - float(prod["price"])) > 0.01:
            await log_fraud(user["id"], "price_tampering", {
                "product_id": i.product_id,
                "client_price": float(i.price),
                "server_price": float(prod["price"]),
            })
        trusted_items.append({
            "product_id": prod["id"],
            "name": prod["name"],
            "price": float(prod["price"]),
            "quantity": i.quantity,
            "image_url": prod.get("image_url", ""),
        })
        subtotal += float(prod["price"]) * i.quantity

    code_doc = await db.discount_codes.find_one({"code": payload.discount_code.strip().upper()})
    if not code_doc:
        await log_fraud(user["id"], "invalid_code", {"code": payload.discount_code.strip().upper()})
        raise HTTPException(status_code=400, detail="Invalid access code")
    if code_doc.get("one_time") and code_doc.get("used"):
        await log_fraud(user["id"], "reused_code", {"code": code_doc["code"]})
        raise HTTPException(status_code=400, detail="Access code already used")
    pd_map = code_doc.get("product_discounts", {}) or {}
    discount = 0.0
    for it in trusted_items:
        amt = float(pd_map.get(it["product_id"], 0) or 0)
        if amt > 0:
            line_total = it["price"] * it["quantity"]
            discount += min(amt, line_total)

    if payload.payment_method not in {"cod", "upi", "razorpay"}:
        await log_fraud(user["id"], "bad_payment_method", {"method": payload.payment_method})
        raise HTTPException(status_code=400, detail="Invalid payment method")

    shipping = 0 if subtotal >= 499 else 49
    total = round(max(0, subtotal - discount + shipping), 2)

    order_id = str(uuid.uuid4())
    order = {
        "id": order_id,
        "order_number": "TS" + order_id[:8].upper(),
        "user_id": user["id"],
        "items": trusted_items,
        "address": payload.address.model_dump(),
        "payment_method": payload.payment_method,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "shipping": shipping,
        "total": total,
        "discount_code": code_doc["code"],
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)

    # Decrement stock
    for item in payload.items:
        await db.products.update_one({"id": item.product_id}, {"$inc": {"stock": -item.quantity}})

    # Mark code used
    if code_doc and code_doc.get("one_time"):
        await db.discount_codes.update_one(
            {"code": code_doc["code"]},
            {"$set": {"used": True, "used_by": user["id"], "used_at": now_iso()}},
        )

    order.pop("_id", None)
    return order


@api.get("/orders/mine")
async def my_orders(user: dict = Depends(get_current_user)):
    items = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if user.get("role") != "admin" and o["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return o


@api.get("/admin/pending-otps")
async def list_pending_otps(_: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    items = await db.otps.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    out = []
    for o in items:
        exp = o.get("expires_at")
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp)
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp and exp > now:
            out.append({"phone": o["phone"], "otp": o["otp"], "created_at": o.get("created_at"), "expires_at": exp.isoformat()})
    return out


@api.get("/admin/fraud-logs")
async def list_fraud_logs(_: dict = Depends(require_admin)):
    items = await db.fraud_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    # Attach minimal user info
    user_ids = list({l["user_id"] for l in items if l.get("user_id")})
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "phone": 1, "name": 1, "email": 1}).to_list(500)
    by_id = {u["id"]: u for u in users}
    for l in items:
        l["user"] = by_id.get(l.get("user_id"), {})
    return items


@api.get("/admin/orders")
async def admin_list_orders(_: dict = Depends(require_admin)):
    items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, payload: OrderStatusUpdate, _: dict = Depends(require_admin)):
    allowed = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True}


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "TestSeries", "status": "ok"}


# Register router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


@app.on_event("startup")
async def startup():
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()
