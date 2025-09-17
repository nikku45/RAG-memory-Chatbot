# backend/token_server.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from livekit import api
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # loads .env if present

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
    raise Exception("Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenResponse(BaseModel):
    token: str

@app.get("/token", response_model=TokenResponse)
def get_token(identity: str, room: str = "test-room"):
    """
    Returns a LiveKit access token JWT for the given identity and room.
    Frontend and agent will call this endpoint to get a token to join (short demo usage).
    """
    try:
        # Build access token with room-join grant
        at = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        at = at.with_identity(identity).with_name(identity).with_grants(
            api.VideoGrants(room_join=True, room=room)
        )
        token_jwt = at.to_jwt()
        return {"token": token_jwt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run: uvicorn token_server:app --reload --port 8000
