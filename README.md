# V3RII Call Center Web - Phase 1

Admin UI for the first configurable call center foundation.

## Screens

- Company settings.
- Weekly business hours.
- Calendar exceptions.
- Departments.
- Routing rules.
- Decision simulation.
- Conversation logs.
- Role-aware company management:
  - Super admin can create/update companies.
  - Company admin can manage assigned company rules.

## Local Run

```bash
npm install
npm run dev
```

The frontend calls the API at:

```text
http://localhost:5179
```

Override with:

```text
VITE_CALLCENTER_API_URL=http://localhost:5179
```
