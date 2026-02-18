#!/usr/bin/env python3
"""
sync-scheduled.py
Scheduled / manual sync: pulls open GitHub issues and ensures they exist in Linear.
Called by the linear-sync.yml workflow on schedule and workflow_dispatch events.

Sync types:
  incremental  - Only issues updated in the last 30 minutes
  full         - All open issues (no time filter)
  repair       - All issues including closed ones
"""

import json
import os
import sys
import time
import requests

GITHUB_API = "https://api.github.com"
LINEAR_API_URL = "https://api.linear.app/graphql"
SYNC_TYPE = os.environ.get("SYNC_TYPE", "incremental")


# ─────────────────────────────────────────────────────────────────────────────
# GitHub helpers
# ─────────────────────────────────────────────────────────────────────────────

def github_headers() -> dict:
    return {
        "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
        "Accept": "application/vnd.github.v3+json",
    }


def fetch_github_issues(repo: str, since: str | None = None) -> list[dict]:
    """Fetch issues from GitHub (paginated)."""
    url = f"{GITHUB_API}/repos/{repo}/issues"
    params: dict = {"state": "open", "per_page": 100, "page": 1}
    if since:
        params["since"] = since

    issues = []
    while True:
        resp = requests.get(url, headers=github_headers(), params=params, timeout=30)
        resp.raise_for_status()
        page = resp.json()
        if not page:
            break
        # Filter out pull requests (GitHub lists them under /issues too)
        issues.extend(i for i in page if "pull_request" not in i)
        if len(page) < 100:
            break
        params["page"] += 1  # type: ignore[operator]

    return issues


# ─────────────────────────────────────────────────────────────────────────────
# Linear helpers
# ─────────────────────────────────────────────────────────────────────────────

def linear_headers() -> dict:
    return {
        "Authorization": os.environ["LINEAR_API_KEY"],
        "Content-Type": "application/json",
    }


def graphql(query: str, variables: dict | None = None) -> dict:
    resp = requests.post(
        LINEAR_API_URL,
        headers=linear_headers(),
        json={"query": query, "variables": variables or {}},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if "errors" in data:
        raise RuntimeError(f"Linear GraphQL errors: {data['errors']}")
    return data["data"]


def get_team_id() -> str:
    team_id = os.environ.get("LINEAR_TEAM_ID")
    if team_id:
        return team_id
    result = graphql("{ teams { nodes { id name } } }")
    return result["teams"]["nodes"][0]["id"]


def get_workflow_states(team_id: str) -> dict[str, str]:
    """Returns {name: id} map for workflow states."""
    query = """
    query WorkflowStates($teamId: String!) {
      workflowStates(filter: { team: { id: { eq: $teamId } } }) {
        nodes { id name }
      }
    }
    """
    result = graphql(query, {"teamId": team_id})
    return {s["name"]: s["id"] for s in result["workflowStates"]["nodes"]}


def find_existing_issue(github_url: str) -> str | None:
    query = """
    query SearchIssue($query: String!) {
      issueSearch(query: $query, last: 1) {
        nodes { id }
      }
    }
    """
    result = graphql(query, {"query": github_url})
    nodes = result["issueSearch"]["nodes"]
    return nodes[0]["id"] if nodes else None


def create_issue(title: str, description: str, team_id: str,
                 state_id: str | None, priority: int) -> str:
    mutation = """
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        issue { id }
        success
      }
    }
    """
    inp: dict = {
        "teamId": team_id,
        "title": title,
        "description": description,
        "priority": priority,
    }
    if state_id:
        inp["stateId"] = state_id

    result = graphql(mutation, {"input": inp})
    if not result["issueCreate"]["success"]:
        raise RuntimeError("issueCreate returned success=false")
    return result["issueCreate"]["issue"]["id"]


# ─────────────────────────────────────────────────────────────────────────────
# Mapping helpers
# ─────────────────────────────────────────────────────────────────────────────

PRIORITY_LABELS = {
    "priority/urgent": 1,
    "priority/high": 2,
    "priority/medium": 3,
    "priority/low": 4,
}


def map_priority(labels: list[dict]) -> int:
    label_names = {lbl.get("name", "").lower() for lbl in labels}
    for label, priority in PRIORITY_LABELS.items():
        if label in label_names:
            return priority
    return 3


def build_description(issue: dict) -> str:
    body = issue.get("body") or "_No description provided._"
    return (
        f"{body}\n\n"
        f"---\n"
        f"**Source**: [GitHub Issue #{issue['number']}]({issue['html_url']})"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    repo = os.environ["REPO_NAME"]
    team_id = get_team_id()
    states = get_workflow_states(team_id)
    todo_state_id = states.get("Todo")

    # Time filter for incremental sync
    since: str | None = None
    if SYNC_TYPE == "incremental":
        # Look back 30 minutes with some buffer
        since = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(time.time() - 35 * 60),
        )

    print(f"[sync] Starting {SYNC_TYPE} sync for {repo} (since: {since or 'beginning'})")
    issues = fetch_github_issues(repo, since=since)
    print(f"[sync] Found {len(issues)} GitHub issues to process")

    results = {"created": 0, "skipped": 0, "errors": 0, "total": len(issues)}

    for issue in issues:
        url = issue["html_url"]
        title = f"[GH] {issue['title']}"
        description = build_description(issue)
        priority = map_priority(issue.get("labels", []))

        try:
            existing_id = find_existing_issue(url)
            if existing_id:
                results["skipped"] += 1
                print(f"[sync] Skipped (exists): #{issue['number']} → {existing_id}")
            else:
                new_id = create_issue(title, description, team_id, todo_state_id, priority)
                results["created"] += 1
                print(f"[sync] Created: #{issue['number']} → {new_id}")
        except Exception as exc:
            results["errors"] += 1
            print(f"::warning::Failed to sync issue #{issue['number']}: {exc}")

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sync_type": SYNC_TYPE,
        "repo": repo,
        "status": "error" if results["errors"] > 0 else "success",
        "results": results,
    }
    with open("sync-report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n[sync] Complete: {results}")
    if results["errors"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        report = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sync_type": SYNC_TYPE,
            "status": "fatal_error",
            "detail": str(exc),
        }
        with open("sync-report.json", "w") as f:
            json.dump(report, f, indent=2)
        print(f"::error::Scheduled sync failed: {exc}", file=sys.stderr)
        sys.exit(1)
