# Admin Frontend

Admin dashboard for managing escalation requests.

## Features

- View all escalation requests in a table
- See all request details (question, status, created_at, resolved_at, response)
- Edit request status (pending, resolved, timeout)
- Add/edit responses to requests
- Real-time updates after editing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. The app will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_BASE_URL=http://localhost:4200
```

## API Endpoints

The app connects to the backend API at:
- `GET /api/escalation-requests` - Fetch all requests
- `PUT /api/escalation-requests/:id` - Update a request
