# Eagle


## Backend setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Frontend setup 

```bash
cd frontend
npm install
npm run dev
```

## To Run

```bash
cd backend 
uvicorn main:app --reload 

# In a new terminal 
cd frontend
npm run dev
```