# BloodBridge

## Problem Statement

During medical emergencies, finding a suitable blood donor quickly can be difficult. Hospitals, blood banks, and emergency coordinators often need a faster way to identify available donors based on blood type, location, and urgency.

## Solution

BloodBridge is a modern emergency-response dashboard that helps users register donors, create emergency blood requests, and identify the most suitable available donors through a transparent Smart Donor Match system.

## Key Features

- Donor registration and full donor management
- Emergency request creation and status updates
- Search, filter, and sorting for donors and requests
- Smart donor matching with score-based ranking
- Dashboard metrics for donor and request visibility
- Responsive medical-style dashboard UI
- Local demo mode plus REST API architecture for backend integration

## Smart Donor Match

When a request is created, the system reads the required blood group and checks for donors with the same blood group who are currently available. It then scores donors using a transparent application-level rule set:

- +50: blood group match
- +20: donor currently available
- +20: donor in the same city/location
- +10: recent availability confirmation

The system ranks donors as a percentage match and displays the result with clear reasons such as:

- ✓ Blood group match
- ✓ Available now
- ✓ Same city
- ✓ Recent availability confirmation

This is not medical advice; it is an operational ranking system designed to speed up emergency coordination.

## Technology Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express.js
- Database: MongoDB
- API style: REST API
- Storage fallback: localStorage demo mode

## Project Structure

```text
bloodbridge/
├── index.html
├── style.css
├── javascript.js
├── README.md
├── .env.example
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── models/
│   │   ├── Donor.js
│   │   └── EmergencyRequest.js
│   ├── routes/
│   │   ├── donorRoutes.js
│   │   └── requestRoutes.js
│   └── controllers/
│       ├── donorController.js
│       └── requestController.js
└── assets/
```

## Installation

```bash
cd "C:\Users\Kamakshi Shenoy\OneDrive\Desktop\Blood donation\bloodbridge\backend"
npm install
```

## Running Frontend

Open the file directly in a browser, or serve it locally:

```bash
cd "C:\Users\Kamakshi Shenoy\OneDrive\Desktop\Blood donation\bloodbridge"
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Running Backend

```bash
cd "C:\Users\Kamakshi Shenoy\OneDrive\Desktop\Blood donation\bloodbridge\backend"
npm start
```

## MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas.
2. Create a database named `bloodbridge`.
3. Update the `.env` file based on `.env.example`.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bloodbridge
```

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bloodbridge
```

## API Documentation

### Donor routes

- POST /api/donors
- GET /api/donors
- GET /api/donors/:id
- PUT /api/donors/:id
- DELETE /api/donors/:id

### Request routes

- POST /api/requests
- GET /api/requests
- GET /api/requests/:id
- PUT /api/requests/:id/status
- DELETE /api/requests/:id

### Health check

- GET /api/health

## Sample Data

The demo includes 10 fictional donor records and 5 fictional emergency requests with varied blood groups, cities, urgency levels, and statuses.

## Testing

Recommended test flow:

1. Open the dashboard.
2. Register a donor.
3. Check donor listing.
4. Create an emergency request.
5. Open request details.
6. Click Find Best Donors.
7. Update request status.
8. Verify dashboard statistics change.

## Future Improvements

- Authentication for hospital and admin roles
- SMS and email notifications for matched donors
- Additional analytics and response heat maps
- Multi-location donor coordination
- Better privacy and consent controls

## Assessment Highlights

This project is stronger than a basic CRUD app because it solves a real emergency response problem, includes operational ranking logic, supports donor and request management, and provides a dashboard-style user workflow that is easy to explain in a live demo.

### Why this project is different

It does more than store donor information. The application actively helps prioritize suitable donors for emergency requests, giving the project a clearly useful real-world function and making it stand out as a genuine emergency coordination system.
