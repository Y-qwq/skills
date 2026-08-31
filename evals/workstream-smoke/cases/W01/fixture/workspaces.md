# Workspace inventory

## messaging-service

- Locator: `/tmp/workstream-eval/repos/messaging-service`
- Owns the bulk mark-read command and API schema.
- Current API has only a single-conversation mark-read operation.

## team-client

- Locator: `/tmp/workstream-eval/repos/team-client`
- Owns the inbox selection UI and generated API client.
- Generated client must follow the messaging-service schema version.

## Acceptance supplied by product

- Staff can select multiple visible conversations and mark them read once.
- A partial backend failure must not make failed conversations appear read.
- Backend contract and frontend behavior require an integration check.
