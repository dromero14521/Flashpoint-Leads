#!/usr/bin/env python3
"""
sync-to-linear.py
Real-time event handler: syncs a single GitHub issue/PR event to Linear.
Called by the linear-sync.yml workflow on issue/PR events.
"""

import json
import os
import sys
import time
import requests

LINEAR_API_URL = "https://api.linear.app/graphql"


def linear_headers():
    key = os.environ["LINEAR_API_KEY"]
    return {"Authorization": key, "Content-Type": "application/json"}


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
    teams = result["teams"]["nodes"]
    if not teams:
        raise RuntimeError("No Linear teams found. Set LINEAR_TEAM_ID secret.")
    return teams[0]["id"]


def find_existing_issue(github_url: str) -> str | None:
    """Find a Linear issue that was created from this GitHub URL."""
    query = """
    query SearchIssue($query: String!) {
      issueSearch(query: $query, last: 1) {
        nodes { id title }
      }
    }
    """
    result = graphql(query, {"query": github_url})
    nodes = result["issueSearch"]["nodes"]
    return nodes[0]["id"] if nodes else None


def map_state(github_state: str, team_id: str) -> str | None:
    """Return the Linear workflow state ID matching the GitHub state."""
    target_name = "Done" if github_state == "closed" else "Todo"
    query = """
    query WorkflowStates($teamId: String!) {
      workflowStates(filter: { team: { id: { eq: $teamId } } }) {
        nodes { id name }
      }
    }
    """
    result = graphql(query, {"teamId": team_id})
    for state in result["workflowStates"]["nodes"]:
        if state["name"] == target_name:
            return state["id"]
    return None


def map_priority(labels_json: str) -> int:
    """Map GitHub labels to Linear priority (1=urgent, 2=high, 3=medium, 4=low)."""
    try:
        labels = json.loads(labels_json or "[]")
        label_names = {lbl.get("name", "").lower() for lbl in labels}
    except (json.JSONDecodeError, TypeError):
        return 3

    priority_map = {
        "priority/urgent": 1,
        "priority/high": 2,
        "priority/medium": 3,
        "priority/low": 4,
    }
    for label, priority in priority_map.items():
        if label in label_names:
            return priority
    return 3


def create_linear_issue(title: str, description: str, team_id: str,
                         state_id: str | None, priority: int) -> str:
    mutation = """
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        issue { id identifier url }
        success
      }
    }
    """
    inp: dict = {"teamId": team_id, "title": title, "description": description,
                 "priority": priority}
    if state_id:
        inp["stateId"] = state_id

    result = graphql(mutation, {"input": inp})
    if not result["issueCreate"]["success"]:
        raise RuntimeError("Linear issueCreate returned success=false")
    return result["issueCreate"]["issue"]["id"]


def update_linear_issue(issue_id: str, state_id: str | None, priority: int,
                         title: str, description: str) -> None:
    mutation = """
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
      }
    }
    """
    inp: dict = {"title": title, "description": description, "priority": priority}
    if state_id:
        inp["stateId"] = state_id
    graphql(mutation, {"id": issue_id, "input": inp})


def build_description(body: str, issue_url: str, event_name: str) -> str:
    source = "Pull Request" if "pull" in event_name else "Issue"
    return (
        f"{body or '_No description provided._'}\n\n"
        f"---\n"
        f"**Source**: [GitHub {source}]({issue_url})"
    )


def write_report(status: str, detail: str) -> None:
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": os.environ.get("EVENT_NAME"),
        "action": os.environ.get("EVENT_ACTION"),
        "issue_number": os.environ.get("ISSUE_NUMBER"),
        "repo": os.environ.get("REPO_NAME"),
        "status": status,
        "detail": detail,
    }
    with open("sync-report.json", "w") as f:
        json.dump(report, f, indent=2)
    print(f"[sync] {status}: {detail}")


def main() -> None:
    event_name = os.environ.get("EVENT_NAME", "")
    action = os.environ.get("EVENT_ACTION", "")
    issue_number = os.environ.get("ISSUE_NUMBER", "")
    raw_title = os.environ.get("ISSUE_TITLE", "Untitled")
    body = os.environ.get("ISSUE_BODY", "")
    github_state = os.environ.get("ISSUE_STATE", "open")
    issue_url = os.environ.get("ISSUE_URL", "")
    labels_json = os.environ.get("ISSUE_LABELS", "[]")

    # Skip bot-generated and excluded events
    if action in ("deleted",) and "comment" not in event_name:
        write_report("skipped", f"Action '{action}' not synced")
        return

    title = f"[GH] {raw_title}"
    description = build_description(body, issue_url, event_name)

    team_id = get_team_id()
    state_id = map_state(github_state, team_id)
    priority = map_priority(labels_json)

    existing_id = find_existing_issue(issue_url)

    if existing_id:
        update_linear_issue(existing_id, state_id, priority, title, description)
        write_report("updated", f"Linear issue updated (existing: {existing_id})")
    else:
        new_id = create_linear_issue(title, description, team_id, state_id, priority)
        write_report("created", f"Linear issue created: {new_id}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        write_report("error", str(exc))
        print(f"::error::Sync failed: {exc}", file=sys.stderr)
        sys.exit(1)
