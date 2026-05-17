import time


provider_quotas = {
    "Remotive": {
        "max_calls": 20,
        "used_calls": 0,
        "reset_after_seconds": 60 * 60,
        "reset_at": time.time() + 60 * 60,
        "paused_until": None,
    },
    "Arbeitnow": {
        "max_calls": 20,
        "used_calls": 0,
        "reset_after_seconds": 60 * 60,
        "reset_at": time.time() + 60 * 60,
        "paused_until": None,
    },
}


def can_call_provider(provider_name):
    quota = provider_quotas.get(provider_name)

    if not quota:
        return False, "Provider quota not configured"

    now = time.time()

    if quota["paused_until"] and now < quota["paused_until"]:
        return False, "Provider is paused"

    if now >= quota["reset_at"]:
        quota["used_calls"] = 0
        quota["reset_at"] = now + quota["reset_after_seconds"]
        quota["paused_until"] = None

    if quota["used_calls"] >= quota["max_calls"]:
        quota["paused_until"] = quota["reset_at"]
        return False, "Quota reached"

    return True, "Allowed"


def record_provider_call(provider_name):
    quota = provider_quotas.get(provider_name)

    if not quota:
        return

    quota["used_calls"] += 1

    if quota["used_calls"] >= quota["max_calls"]:
        quota["paused_until"] = quota["reset_at"]


def get_quota_status():
    result = []

    for provider, quota in provider_quotas.items():
        result.append(
            {
                "provider": provider,
                "usedCalls": quota["used_calls"],
                "maxCalls": quota["max_calls"],
                "resetAt": quota["reset_at"],
                "pausedUntil": quota["paused_until"],
            }
        )

    return result