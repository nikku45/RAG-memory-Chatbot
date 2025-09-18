# LiveKit Memory Chat Agent

An AI-powered real-time chat agent built with **LiveKit**, **Next.js**, and a Python agent integrating **Gemini API** and **mem0** for memory.

The agent joins a LiveKit chat room as a participant, recalls user context across sessions, and generates personalized responses in real time.

---

## ✨ Features

- Real-time chat using LiveKit
- Minimal Next.js frontend for chat UI
- Python AI agent that joins as a participant
- Memory-augmented conversation using mem0
- LLM-powered responses via Gemini API (can be swapped with OpenAI)
- Contextual, personalized interactions across sessions

---

## 📂 Project Structure

```
livekit-memory-chat-agent/
│
├── backend/        # FastAPI backend for LiveKit token generation
├── frontend/       # Next.js minimal chat UI
├── agent/          # Python AI agent (Gemini + mem0)
└── README.md       # Documentation
```

---

## ⚙️ Tech Stack

- **Frontend:** Next.js, livekit-client
- **Backend:** FastAPI, LiveKit server SDK
- **Agent:** Python, livekit-rtc, google-generativeai, mem0ai
- **AI Model:** Google Gemini (replaceable with OpenAI GPT)
- **Memory:** mem0 (or fallback to local JSON storage)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/livekit-memory-chat-agent.git
cd livekit-memory-chat-agent
```

### 2. Backend (FastAPI token server)

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn token_server:app --reload --port 8000
```

### 3. Frontend (Next.js UI)

```bash
cd ../frontend
npm install
npm run dev
```

App will be available at: [http://localhost:3000](http://localhost:3000)

### 4. Agent (Python AI participant)

```bash
cd ../agent
python -m venv venv
# Windows
.\venv\Scripts\activate
pip install -r requirements.txt

python agent_gemini.py
```

---

## 🔑 Environment Variables

Create `.env` files in `backend/`, `frontend/`, and `agent/`.

**Example `.env` (for agent):**
```
LIVEKIT_URL=wss://<your-subdomain>.livekit.cloud
TOKEN_SERVER=http://localhost:8000
AGENT_IDENTITY=ai-agent
ROOM_NAME=test-room

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# mem0
MEM0_API_KEY=your_mem0_api_key
MEM0_ORG_ID=your_org_id
MEM0_PROJECT_ID=your_project_id
```

---

## 🧪 Demo Flow

1. Start backend → runs token server
2. Start frontend → join with username
3. Start agent → joins the room automatically

**Example conversation:**
- User: “I like pizza and biking”
- Agent stores memory and replies via Gemini
- User rejoins later and asks: “What do I like?”
- Agent recalls memory → “You said you like pizza and biking”

---

## 📹 Demo Video

A short Loom video demo is included here:  
👉 [Demo Video Link](#) (https://drive.google.com/file/d/1ARtlW167xQ_0e5VYAqPREh69RVUAG95Z/view?usp=sharing)

---

## 📘 Documentation

- [LiveKit Documentation](https://docs.livekit.io/)
- [Gemini API Docs](https://ai.google.dev/)
- [mem0 Documentation](https://docs.mem0.ai/)

---

## 📝 License

This project is created as part of an internship assignment.  
Feel free to use or extend for learning purposes.