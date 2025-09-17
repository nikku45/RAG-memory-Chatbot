# agent/agent_gemini.py
import os
import asyncio
import json
import traceback
from dotenv import load_dotenv
from livekit.rtc import Room
import requests
from mem0 import MemoryClient   # mem0 client

# NEW: import Gemini SDK
import google.generativeai as genai

load_dotenv()

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
TOKEN_SERVER = os.getenv("TOKEN_SERVER", "http://localhost:8000")
AGENT_IDENTITY = os.getenv("AGENT_IDENTITY", "ai-agent")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # NEW
MEM0_API_KEY = os.getenv("MEM0_API_KEY")
MEM0_ORG = os.getenv("MEM0_ORG_ID")
MEM0_PROJECT = os.getenv("MEM0_PROJECT_ID")
ROOM_NAME = os.getenv("ROOM_NAME", "test-room")

if not GEMINI_API_KEY:
    raise Exception("Set GEMINI_API_KEY in agent/.env")

# Configure Gemini client

genai.configure(api_key=GEMINI_API_KEY)

# instantiate mem0 client
mem_client = MemoryClient(api_key=MEM0_API_KEY, org_id=MEM0_ORG, project_id=MEM0_PROJECT)

async def run_agent():
    # get a token for the agent identity
    r = requests.get(f"{TOKEN_SERVER}/token", params={"identity": AGENT_IDENTITY, "room": ROOM_NAME})
    r.raise_for_status()
    token = r.json().get("token")
    # print("got token:", token)
    if not token:
        raise Exception("No token returned from token server")

    room = Room()
    gemini_model=genai.GenerativeModel("gemini-2.5-flash")
    @room.on("participant_connected")
    def on_participant_connected(participant):
        print(f"[agent] participant joined: {participant.identity}")
     
    @room.on("data_received")
    def on_data_received(payload):
        topic="chat"
        try:
            text = payload.data.decode("utf-8")
            # parse JSON
            try:
                msg = json.loads(text)
                username = msg.get("username")
                user_text = msg.get("text") or ""
            except Exception:
                username = "unknown"
                user_text = text

            # ignore messages from agent itself
            if username == AGENT_IDENTITY:
                return

            print(f"[agent] got message from {username}: {user_text!r}")

            # 1) retrieve relevant memories
            try:
                print(f"[agent] searching mem0 for user_id={username}")
                memories = mem_client.search(query=f"What do you know about {username}?", filters={"user_id":username},  version="v2")
                print(f"[agent] mem0 search got {len(memories or [])} results")
                memory_texts = []
                for m in (memories or [])[:6]:
                    if isinstance(m, dict):
                        content = m.get("content") or m.get("text") or m.get("message") or str(m)
                    else:
                        content = str(m)
                    memory_texts.append(content)
                memory_block = "\n".join(memory_texts) if memory_texts else "(no memory)"
            except Exception as e:
                print("[agent] mem0 search failed:", e)
                memory_block = "(mem0 search failed)"

            # 2) build prompt + include memory
            system_prompt = f"You are a helpful chat assistant that remembers user facts and preferences. Use memory where appropriate."
            full_prompt = f"{system_prompt}\nMemory for {username}:\n{memory_block}\nUser: {user_text}"

            # 3) call Gemini generate_content
            response = gemini_model.generate_content(
                     # you can choose another model if available
                contents=full_prompt
            )
            # The response structure: .text in many cases
            reply_text = response.text.strip()
            print(f"[agent] Gemini reply: {reply_text}")

            # 4) publish reply back
            out = json.dumps({"username": AGENT_IDENTITY, "text": reply_text})
            asyncio.create_task(room.local_participant.publish_data(out, reliable=True, topic="chat"))

            # 5) store new memory
            try:
                mem_client.add([{"role":"user","content": user_text}], user_id=username)
            except Exception as e:
                print("[agent] mem0 add failed:", e)

        except Exception as err:
            print("[agent] error handling data:", err)
            traceback.print_exc()

    # connect
    print("[agent] connecting to LiveKit...")
    await room.connect(LIVEKIT_URL, token)
    print("[agent] connected. Listening for chat messages...")
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(run_agent())
