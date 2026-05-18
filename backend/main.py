from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
import hashlib
import os
import re
from job_providers import fetch_remotive_jobs as fetch_remotive_provider_jobs, fetch_arbeitnow_jobs
from quota_manager import can_call_provider, record_provider_call, get_quota_status
import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI(title="Siva Job Dashboard API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://siva-job-dashboard.web.app",
        "https://siva-job-dashboard.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIREBASE_PROJECT_ID = "siva-job-dashboard"

if not firebase_admin._apps:
    if os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(
            cred,
            {"projectId": FIREBASE_PROJECT_ID},
        )
    else:
        firebase_admin.initialize_app(
            options={"projectId": FIREBASE_PROJECT_ID}
        )

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

    for item in data.get("jobs", [])[:30]:
        job = {
    "title": item.get("title") or "",
    "company": item.get("company_name") or "",
    "location": item.get("candidate_required_location") or "",
    "link": item.get("url") or "",
    "url": item.get("url") or "",
    "source": "Remotive",
    "description": clean_html(item.get("description")),
    "status": "Saved",
}

        job["duplicateKey"] = generate_duplicate_key(job)

        jobs.append(job)

    return jobs

def calculate_skill_score(job_text, skills, max_points):
    if not skills:
        return 0

    matched_skills = []

    for skill in skills:
        skill_lower = skill.lower()

        if skill_lower in job_text:
            matched_skills.append(skill_lower)

    return round((len(matched_skills) / len(skills)) * max_points)


def calculate_title_score(title):
    target_titles = [
        "senior software engineer",
        "software engineer",
        "java developer",
        "full stack developer",
        "backend engineer",
        "cloud engineer",
        "devops engineer",
    ]

    title_lower = title.lower()

    for target_title in target_titles:
        if target_title in title_lower:
            return 20

    if "engineer" in title_lower or "developer" in title_lower:
        return 12

    return 5


def calculate_experience_score(job_text):
    if (
        "8+ years" in job_text
        or "8 years" in job_text
        or "7+ years" in job_text
        or "7 years" in job_text
        or "senior" in job_text
        or "lead" in job_text
    ):
        return 15

    if (
        "5+ years" in job_text
        or "5 years" in job_text
        or "6+ years" in job_text
        or "6 years" in job_text
    ):
        return 13

    if "3+ years" in job_text or "4+ years" in job_text:
        return 10

    if "10+ years" in job_text or "12+ years" in job_text:
        return 8

    return 5


def calculate_backend_ats_score(job):
    technical_skills = [
        "java",
        "spring boot",
        "spring",
        "microservices",
        "react",
        "angular",
        "rest api",
        "sql",
        "kafka",
    ]

    cloud_skills = [
        "aws",
        "azure",
        "docker",
        "kubernetes",
        "ci/cd",
        "terraform",
        "devops",
        "cloud",
    ]

    domain_skills = [
        "banking",
        "financial services",
        "finance",
        "fraud",
        "healthcare",
        "fhir",
        "hl7",
        "insurance",
    ]

    job_text = f"""
    {job.get("title", "")}
    {job.get("company", "")}
    {job.get("location", "")}
    {job.get("description", "")}
    """.lower()

    technical_score = calculate_skill_score(job_text, technical_skills, 40)
    title_score = calculate_title_score(job.get("title", ""))
    experience_score = calculate_experience_score(job_text)
    cloud_score = calculate_skill_score(job_text, cloud_skills, 15)
    domain_score = calculate_skill_score(job_text, domain_skills, 10)

    total_score = (
        technical_score
        + title_score
        + experience_score
        + cloud_score
        + domain_score
    )

    return min(round(total_score), 100)

def save_or_update_job(job, min_score=70):
    duplicate_key = job.get("duplicateKey") or generate_duplicate_key(job)
    job["duplicateKey"] = duplicate_key

    existing_jobs = list(
        db.collection("jobs")
        .where("duplicateKey", "==", duplicate_key)
        .limit(1)
        .stream()
    )

    job["status"] = job.get("status") or "Saved"
    job["matchScore"] = calculate_backend_ats_score(job)
    if job["matchScore"] < min_score:
     return "skipped_low_score"
    job["updatedAt"] = firestore.SERVER_TIMESTAMP
    job["userId"] = USER_ID

    if existing_jobs:
        existing_doc = existing_jobs[0]
        existing_doc.reference.set(job, merge=True)
        return "updated"

    job["createdAt"] = firestore.SERVER_TIMESTAMP
    db.collection("jobs").add(job)
    return "saved"

@app.get("/fetch-jobs")
def fetch_jobs():
    jobs = fetch_remotive_jobs()

    saved_count = 0
    updated_count = 0

    for job in jobs:
        result = save_or_update_job(job)

        if result == "saved":
            saved_count += 1
        elif result == "updated":
            updated_count += 1

    return {
        "message": "Job fetch completed",
        "source": "Remotive",
        "fetched": len(jobs),
        "saved": saved_count,
        "updatedExisting": updated_count,
    }

@app.get("/fetch-all-jobs")
@app.get("/fetch-all-jobs")
def fetch_all_jobs(
    providers: str = Query(default="Remotive,Arbeitnow"),
    min_score: int = Query(default=70),
):
    selected_provider_names = [
        provider.strip()
        for provider in providers.split(",")
        if provider.strip()
    ]

    available_providers = [
        {
            "name": "Remotive",
            "fetch_function": lambda: fetch_remotive_provider_jobs(
                keyword="java spring boot react angular aws",
                limit=30,
            ),
        },
        {
            "name": "Arbeitnow",
            "fetch_function": lambda: fetch_arbeitnow_jobs(limit=30),
        },
    ]

    providers_to_run = [
        provider
        for provider in available_providers
        if provider["name"] in selected_provider_names
    ]

    total_fetched = 0
    total_saved = 0
    total_updated = 0
    total_skipped_low_score = 0
    provider_results = []

    for provider in providers_to_run:
        provider_name = provider["name"]

        allowed, reason = can_call_provider(provider_name)

        if not allowed:
            provider_results.append(
                {
                    "provider": provider_name,
                    "status": "skipped",
                    "reason": reason,
                }
            )
            continue

        try:
            record_provider_call(provider_name)

            jobs = provider["fetch_function"]()
            total_fetched += len(jobs)

            saved_count = 0
            updated_count = 0
            skipped_low_score_count = 0

            for job in jobs:
                result = save_or_update_job(job, min_score=min_score)

                if result == "saved":
                    saved_count += 1
                elif result == "updated":
                    updated_count += 1
                elif result == "skipped_low_score":
                    skipped_low_score_count += 1

            total_saved += saved_count
            total_updated += updated_count
            total_skipped_low_score += skipped_low_score_count

            provider_results.append(
                {
                    "provider": provider_name,
                    "status": "success",
                    "fetched": len(jobs),
                    "saved": saved_count,
                    "updated": updated_count,
                    "skippedLowScore": skipped_low_score_count,
                }
            )

        except Exception as error:
            provider_results.append(
                {
                    "provider": provider_name,
                    "status": "failed",
                    "error": str(error),
                }
            )

    return {
        "message": "Multi-provider job fetch completed",
        "selectedProviders": selected_provider_names,
        "minimumScore": min_score,
        "totalFetched": total_fetched,
        "totalSaved": total_saved,
        "totalUpdated": total_updated,
        "totalSkippedLowScore": total_skipped_low_score,
        "providers": provider_results,
        "quota": get_quota_status(),
    }
@app.get("/provider-quotas")
def provider_quotas_status():
    return {
        "providers": get_quota_status()
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