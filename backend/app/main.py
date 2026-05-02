from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, profile, events, home, blacklist

app = FastAPI(title="Eagle Event Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["auth"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(events.router, prefix="/event", tags=["events"])
app.include_router(home.router, prefix="/home", tags=["home"])
app.include_router(blacklist.router, prefix="/black-list", tags=["blacklist"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Eagle Event Management API"}
