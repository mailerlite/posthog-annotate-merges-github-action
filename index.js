import { getInput, setFailed } from "@actions/core";
import fetch from "node-fetch";

try {
  const projectId = getInput("posthog-project-id");
  const posthogToken = getInput("posthog-token");
  const posthogAPIHost = getInput("posthog-api-host");
  const annotationMessage = getInput("annotation-message");
  const dashboardItem = getInput("dashboard-item");

  const body = {
    content: annotationMessage,
    scope: dashboardItem ? "dashboard_item" : "project",
    date_marker: new Date().toISOString(),
    creation_type: "GIT"
  };

  // If dashboard_item is provided, add it to the body
  if (dashboardItem) {
    body.dashboard_item = parseInt(dashboardItem, 10);
  }

  // API docs at https://posthog.com/docs/api/annotations#post-api-projects-project_id-annotations
  fetch(`${posthogAPIHost}/api/projects/${projectId}/annotations/`, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${posthogToken}`,
    },
  })
    .then((response) => {
      response.json().then((data) => {
        console.log("success", data);
      });
    })
    .catch((error) => {
      console.error("error", error);
    });
} catch (error) {
  setFailed(error.message);
}
