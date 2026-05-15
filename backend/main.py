from fastapi import FastAPI
import requests
import hashlib
import re
import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI(title="Siva Job Dashboard API")

cred = credentials.Certificate("serviceAccountKey.json")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
USER_ID = "joPaLOq2ZtcLwHajs7m7dxoRnlc2"

@app.get("/")
def home():
    return {
        "message": "Siva Job Dashboard backend is running",
        "status": "ok",
        "version": "phase-4g-user-import",
    }


def clean_html(raw_html):
    if not raw_html:
        return ""

    clean_text = re.sub("<.*?>", " ", raw_html)
    clean_text = re.sub(r"\s+", " ", clean_text)

    return clean_text.strip()


def generate_duplicate_key(job):
    raw_key = (
        f"{job.get('company', '')}_"
        f"{job.get('title', '')}_"
        f"{job.get('location', '')}"
    )
    normalized_key = raw_key.lower().strip()

    return hashlib.md5(normalized_key.encode()).hexdigest()


def fetch_remotive_jobs():
    url = "https://remotive.com/api/remote-jobs?search=aws"

    response = requests.get(url, timeout=20)
    response.raise_for_status()

    data = response.json()
    jobs = []

    for item in data.get("jobs", [])[:10]:
        job = {
            "title": item.get("title") or "",
            "company": item.get("company_name") or "",
            "location": item.get("candidate_required_location") or "",
            "url": item.get("url") or "",
            "source": "Remotive",
            "description": clean_html(item.get("description")),
            "status": "New",
        }

        job["duplicateKey"] = generate_duplicate_key(job)

        jobs.append(job)

    return jobs


@app.get("/fetch-jobs")
def fetch_jobs():
    jobs = fetch_remotive_jobs()

    saved_count = 0
    updated_count = 0

    for job in jobs:
        duplicate_key = job["duplicateKey"]

        existing_jobs = list(
            db.collection("jobs")
            .where("duplicateKey", "==", duplicate_key)
            .limit(1)
            .stream()
        )

        job["status"] = "Saved"
        job["matchScore"] = 75
        job["updatedAt"] = firestore.SERVER_TIMESTAMP
        job["userId"] = USER_ID

        if existing_jobs:
            existing_doc = existing_jobs[0]
            existing_doc.reference.set(job, merge=True)
            updated_count += 1
            continue

        job["createdAt"] = firestore.SERVER_TIMESTAMP

        db.collection("jobs").add(job)
        saved_count += 1

    return {
        "message": "Job fetch completed",
        "fetched": len(jobs),
        "saved": saved_count,
        "updatedExisting": updated_count,
    }


@app.get("/preview-jobs")
def preview_jobs():
    jobs = fetch_remotive_jobs()

    return {
        "message": "Jobs preview fetched successfully",
        "fetched": len(jobs),
        "jobs": jobs,
    }


@app.get("/test-firestore")
def test_firestore():
    test_ref = db.collection("backend_tests").document("connection_test")

    test_ref.set(
        {
            "message": "Backend connected to Firestore successfully",
            "status": "ok",
        },
        merge=True,
    )

    return {
        "message": "Firestore test document written successfully",
        "status": "ok",
    }