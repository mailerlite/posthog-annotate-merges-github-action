# PostHog GitHub Action

This action lets you send annotations to PostHog from your GitHub actions.

At PostHog we use it to track when PRs are merged

## Inputs

### `posthog-API-token`

**Required** Your PostHog Personal API Token. Not the write-only project key. Create a personal api token at https://app.posthog.com/me/settings

### `posthog-project-id

**Required** Your PostHog Project ID. You can find this in the project settings.

### `posthog-api-host`

Your PostHog API Host.

Defaults to "https://app.posthog.com"

### `annotation-message`

**REQUIRED** The message to send to PostHog.

### `dashboard-item`

**Optional** The dashboard item ID to scope the annotation to a specific dashboard item. If not provided, the annotation will be created at the project level (default behavior).

## Development

### Running Tests

```bash
# Install dependencies
npm install

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite covers:
- Creating project-level annotations (default behavior)
- Creating dashboard-item scoped annotations
- Handling API errors
- Custom API host configuration

## Example usage

Your personal API token must be kept secret.

```yaml
name: Report PR to PostHog

on:
  pull_request:
    types:
      - closed

jobs:
  report-pr-age:
    name: Report PR to PostHog
    runs-on: ubuntu-20.04
    if: github.event.pull_request.merged == true
    steps:
      - name: Report PR to PostHog
        uses: PostHog/posthog-annotate-merges-github-action@0.1.4
        with:
          posthog-token: ${{secrets.POSTHOG_PERSONAL_API_KEY}}
          posthog-project-id: ${{secrets.POSTHOG_PROJECT_ID}}
          annotation-message: "Merged PR #${{github.event.pull_request.number}} ${{github.event.pull_request.title}}"
```

Example usage with dashboard item scope

```yaml
- name: Report PR to PostHog Dashboard
  uses: PostHog/posthog-annotate-merges-github-action@0.1.4
  with:
    posthog-token: ${{secrets.POSTHOG_PERSONAL_API_KEY}}
    posthog-project-id: ${{secrets.POSTHOG_PROJECT_ID}}
    annotation-message: "Merged PR #${{github.event.pull_request.number}} ${{github.event.pull_request.title}}"
    dashboard-item: 12345
```
