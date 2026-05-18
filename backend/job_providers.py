import re
import time
import requests


def clean_html(text):
    if not text:
        return ""

    clean_text = re.sub(r"<[^>]+>", " ", text)
    clean_text = re.sub(r"\s+", " ", clean_text)
    return clean_text.strip()


def normalize_job(job):
    """
    Converts every job board response into one common format.
    Your frontend can then show all jobs the same way.
    """
    return {
        "title": job.get("title", ""),
        "company": job.get("company", ""),
        "location": job.get("location", ""),
        "link": job.get("link", ""),
        "url": job.get("url", ""),
        "source": job.get("source", ""),
        "description": job.get("description", ""),
        "status": "Saved",
        "jobType": job.get("jobType", ""),
        "dateApplied": "",
        "matchScore": job.get("matchScore", ""),
        "recruiterName": "",
        "recruiterEmail": "",
        "interviewDate": "",
        "followUpDate": "",
        "nextAction": "",
        "requiredSkills": "",
        "matchedSkills": "",
        "missingSkills": "",
        "notes": "",
    }


def create_duplicate_key(job):
    company = job.get("company", "").lower().strip()
    title = job.get("title", "").lower().strip()
    location = job.get("location", "").lower().strip()
    source = job.get("source", "").lower().strip()

    return f"{source}|{company}|{title}|{location}"


def fetch_remotive_jobs(keyword="java spring boot", limit=30):
    url = "https://remotive.com/api/remote-jobs"

    response = requests.get(
        url,
        params={"search": keyword},
        timeout=20,
    )
    response.raise_for_status()

    data = response.json()
    jobs = []

    for item in data.get("jobs", [])[:limit]:
        job = normalize_job(
            {
                "title": item.get("title") or "",
                "company": item.get("company_name") or "",
                "location": item.get("candidate_required_location") or "Remote",
                "link": item.get("url") or "",
                "url": item.get("url") or "",
                "source": "Remotive",
                "description": clean_html(item.get("description")),
                "jobType": item.get("job_type") or "",
            }
        )

        job["duplicateKey"] = create_duplicate_key(job)
        jobs.append(job)

    return jobs


def fetch_arbeitnow_jobs(limit=30):
    url = "https://www.arbeitnow.com/api/job-board-api"

    response = requests.get(url, timeout=20)
    response.raise_for_status()

    data = response.json()
    jobs = []

    for item in data.get("data", [])[:limit]:
        job_types = item.get("job_types") or []

        job = normalize_job(
            {
                "title": item.get("title") or "",
                "company": item.get("company_name") or "",
                "location": item.get("location") or "",
                "link": item.get("url") or "",
                "url": item.get("url") or "",
                "source": "Arbeitnow",
                "description": clean_html(item.get("description")),
                "jobType": ", ".join(job_types) if isinstance(job_types, list) else "",
            }
        )

        job["duplicateKey"] = create_duplicate_key(job)
        jobs.append(job)

    return jobs
def fetch_the_muse_jobs(keyword="software engineer", limit=30):
    url = "https://www.themuse.com/api/public/jobs"

    response = requests.get(
        url,
        params={
            "page": 1,
            "category": "Software Engineering",
        },
        timeout=20,
    )
    response.raise_for_status()

    data = response.json()
    jobs = []

    for item in data.get("results", [])[:limit]:
        company = item.get("company") or {}
        locations = item.get("locations") or []
        refs = item.get("refs") or {}

        location_text = ""
        if locations:
            location_text = locations[0].get("name", "")

        job = normalize_job(
            {
                "title": item.get("name") or "",
                "company": company.get("name") or "",
                "location": location_text,
                "link": refs.get("landing_page") or "",
                "url": refs.get("landing_page") or "",
                "source": "The Muse",
                "description": clean_html(item.get("contents")),
                "jobType": "",
            }
        )

        job["duplicateKey"] = create_duplicate_key(job)
        jobs.append(job)

    return jobs