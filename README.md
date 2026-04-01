# Safe Cracker

A small Flask app that cracks a 10-digit combination lock digit-by-digit and streams live progress to the browser.

## Setup

```
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000, enter any 10-digit combination, and watch the attempt counter climb in real time.

## How it works

POST /api/crack_safe/ starts a background thread that tries digits 0-9 at each position in order, locking in a digit the moment check_combination returns a higher match count. The frontend polls GET /api/status/<job_id> every 500ms and stops when done is true.
