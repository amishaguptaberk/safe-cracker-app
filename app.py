import threading
import time
import uuid
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
jobs = {}


def check_combination(guess, actual):
    return sum(g == a for g, a in zip(guess, actual))


def crack_safe(combo, job_id=None):
    start = time.time()
    attempts = 0
    current = ["0"] * 10

    for position in range(10):
        for digit in "0123456789":
            current[position] = digit
            attempts += 1
            if job_id is not None:
                jobs[job_id]["attempts"] = attempts
            if check_combination(current, combo) == position + 1:
                break

    return attempts, round(time.time() - start, 3)


def run_crack_safe(job_id, combo):
    attempts, time_taken = crack_safe(combo, job_id)
    jobs[job_id]["attempts"] = attempts
    jobs[job_id]["done"] = True
    jobs[job_id]["time_taken"] = time_taken


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/crack_safe/", methods=["POST"])
def start_crack():
    data = request.get_json(force=True)
    combo = data.get("actual_combination", "")
    if not (len(combo) == 10 and combo.isdigit()):
        return jsonify({"error": "actual_combination must be exactly 10 digits"}), 400

    job_id = uuid.uuid4().hex[:8]
    jobs[job_id] = {"attempts": 0, "done": False, "time_taken": None}
    threading.Thread(target=run_crack_safe, args=(job_id, combo), daemon=True).start()
    return jsonify({"job_id": job_id})


@app.route("/api/status/<job_id>")
def status(job_id):
    job = jobs.get(job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    return jsonify(job)


if __name__ == "__main__":
    app.run(debug=True)
