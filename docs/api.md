# Pujofy Backend API Specification

## Overview
Base URL: `http://localhost:3000`

All endpoints accept and return JSON format.

---

## Endpoints

### 1. Health Check
`GET /health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-10-03T21:00:00.000Z"
}
```

---

### 2. Search Nearby Pandals
`GET /api/pandals/nearby`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | Float | Yes | - | User latitude (e.g. 22.57) |
| `lng` | Float | Yes | - | User longitude (e.g. 88.36) |
| `radius` | Number | No | 5000 | Search radius in meters |

**Response (200 OK):**
```json
{
  "count": 5,
  "userLocation": {
    "lat": 22.57,
    "lng": 88.36
  },
  "radiusMeters": 5000,
  "data": [
    {
      "pandal": {
        "id": "11111111-1111-1111-1111-111111111102",
        "name": "College Square",
        "description": "Iconic traditional pandal with light reflection on water tank.",
        "latitude": 22.5746,
        "longitude": 88.3637,
        "address": "53 College Street",
        "area": "College Square",
        "city": "Kolkata",
        "category": "Heritage & Lighting",
        "estimatedVisitMinutes": 35,
        "openingTime": "00:00",
        "closingTime": "23:59",
        "isActive": true
      },
      "distanceMeters": 642,
      "crowdReport": {
        "id": "cr-11111111-1111-1111-1111-111111111102",
        "pandalId": "11111111-1111-1111-1111-111111111102",
        "crowdLevel": "HIGH",
        "crowdScore": 0.75,
        "queueMinutes": 45,
        "confidence": 0.9,
        "source": "USER"
      }
    }
  ]
}
```

---

### 3. Get Pandal Details
`GET /api/pandals/:id`

**Response (200 OK):**
```json
{
  "data": {
    "id": "11111111-1111-1111-1111-111111111101",
    "name": "Sree Bhumi Sporting Club",
    "description": "Famous for spectacular lighting and grand architectural replica pandals.",
    "latitude": 22.5982,
    "longitude": 88.3985,
    "address": "VIP Road, Lake Town",
    "area": "Lake Town",
    "city": "Kolkata",
    "category": "Grand Architecture",
    "estimatedVisitMinutes": 45,
    "openingTime": "00:00",
    "closingTime": "23:59",
    "isActive": true
  }
}
```

---

### 4. Submit Crowd Report
`POST /api/crowd/report`

**Request Body:**
```json
{
  "pandalId": "11111111-1111-1111-1111-111111111101",
  "crowdLevel": "LOW",
  "queueMinutes": 10,
  "confidence": 0.9,
  "source": "USER"
}
```

**Response (201 Created):**
```json
{
  "message": "Crowd report submitted successfully",
  "data": {
    "id": "cr-1727989200000-123",
    "pandalId": "11111111-1111-1111-1111-111111111101",
    "crowdLevel": "LOW",
    "crowdScore": 0.25,
    "queueMinutes": 10,
    "confidence": 0.9,
    "source": "USER",
    "reportedAt": "2026-10-03T21:30:00.000Z",
    "expiresAt": "2026-10-03T23:30:00.000Z",
    "createdAt": "2026-10-03T21:30:00.000Z"
  }
}
```

---

### 5. Recommendation Engine (Next Pandal Recommendation)
`GET /api/recommendations/next`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | Float | Yes | - | User latitude |
| `lng` | Float | Yes | - | User longitude |
| `mode` | Enum | No | `BALANCED` | `QUICK_HOP` \| `LOW_CROWD` \| `BALANCED` |
| `radius` | Number | No | 5000 | Search radius in meters |

**Response (200 OK):**
```json
{
  "recommended": {
    "pandal": {
      "id": "11111111-1111-1111-1111-111111111110",
      "name": "Mudiali Club",
      "latitude": 22.5115,
      "longitude": 88.3512,
      "address": "Southern Avenue",
      "area": "Kalighat"
    },
    "distanceMeters": 1200,
    "estimatedTravelMinutes": 16,
    "crowdLevel": "LOW",
    "crowdConfidence": 0.9,
    "queueMinutes": 5,
    "estimatedVisitDurationMinutes": 25,
    "score": 0.125,
    "explanation": "Optimal choice balancing distance (1.2 km) and low crowd level."
  },
  "alternatives": [
    {
      "pandal": { ... },
      "distanceMeters": 1500,
      "estimatedTravelMinutes": 20,
      "crowdLevel": "MEDIUM",
      "crowdConfidence": 0.85,
      "queueMinutes": 15,
      "estimatedVisitDurationMinutes": 30,
      "score": 0.285,
      "explanation": "Balanced alternative pandal nearby (1.5 km, ~15 min queue)."
    }
  ],
  "totalEvaluated": 12,
  "userLocation": {
    "lat": 22.57,
    "lng": 88.36
  },
  "mode": "BALANCED"
}
```
