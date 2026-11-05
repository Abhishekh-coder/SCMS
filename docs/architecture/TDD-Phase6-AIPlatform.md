# 📘 Phase 6 – AI Intelligence Platform Technical Design Document (TDD v6.0)

---

## 1. Architectural Philosophy: AI ADVISES, HUMANS DECIDE

The **AI Intelligence Platform** provides predictive assistance, natural-language summarization, and smart triage to students, faculty, HODs, and campus executives. To guarantee operational safety and compliance, the AI subsystem operates strictly under a **Human-in-the-Loop (HITL)** architecture:

```
Complaint Submission / HOD Triage / Executive Dashboard
                           │
                           ▼
              [ AI Intelligence Platform ]
                           │
 ├─────────────────────────┼─────────────────────────┐
 ▼                         ▼                         ▼
Smart Triage &            Automated Complaint       Smart Routing &
Duplicate Detection       Summarization             Faculty Recommendations
(Similarity Matching)     (2-Sentence Digest)       (Workload & Topic Match)
                           │
                           ▼
          AI Recommendation Metadata Enclosure:
           ├── confidenceScore (0.0 to 1.0)
           ├── reasoningSummary (Explanation text)
           ├── sourceData (Reference complaint IDs / Policy links)
           └── humanApprovalStatus ('PENDING' | 'APPROVED' | 'REJECTED')
```

---

## 2. Core AI Capabilities

1. **Smart Triage & Duplicate Detection**:
   - Evaluates incoming complaint `title` and `description`.
   - Computes semantic similarity against existing open complaints in the department.
   - Flagged as potential duplicate if `similarityScore >= 0.85`.
2. **Automated Complaint Summarization**:
   - Condenses long descriptions and multi-comment threads into a concise 2-sentence executive summary for HOD/Dean dashboards.
3. **Smart Routing & Faculty Assignment Matching**:
   - Analyzes complaint topic, department, and current faculty workload to suggest the optimal handler (subject to HOD approval).
4. **Suggested Resolution Responses**:
   - Generates polite, policy-aligned response drafts for faculty handlers.

---

## 3. Metadata Enclosure Standard

Every AI prediction or recommendation returns the mandatory metadata structure:

```json
{
  "recommendationUuid": "rec_901823941",
  "targetEntityUuid": "cmp_801923841",
  "recommendationType": "FACULTY_ASSIGNMENT",
  "suggestedValue": {
    "facultyUserUuid": "user_fac_102",
    "facultyName": "Dr. Suresh Kumar"
  },
  "metadata": {
    "confidenceScore": 0.92,
    "reasoningSummary": "Dr. Suresh Kumar is HOD of CSE and has 100% resolution SLA compliance in Hostel Maintenance cases.",
    "sourceData": ["cmp_801923001", "cmp_801923005"],
    "humanApprovalStatus": "PENDING"
  }
}
```

---

## 4. Schemas & Collections

### 4.1 `aiRecommendations` Collection
| Field | Type | Required | Description |
|---|---|---|---|
| `recommendationUuid` | String | Yes | Unique UUID v4 (Indexed) |
| `complaintUuid` | String | Yes | Target complaint UUID (Indexed) |
| `recommendationType` | String | Yes | Enum: `['CATEGORY_TRIAGE', 'DUPLICATE_DETECTION', 'SUMMARIZATION', 'FACULTY_ASSIGNMENT', 'SUGGESTED_RESPONSE']` |
| `confidenceScore` | Number | Yes | Value between `0.0` and `1.0` |
| `reasoningSummary` | String | Yes | Natural language explanation |
| `humanApprovalStatus` | String | Yes | Enum: `['PENDING', 'APPROVED', 'REJECTED']` (Indexed) |
| `actionedByUuid` | String | No | User UUID of approving/rejecting human |

---

## 5. API Contracts

- `POST /api/v1/ai/triage`: Analyze complaint text and return category + duplicate suggestions.
- `POST /api/v1/ai/summarize`: Return 2-sentence summary of complaint thread.
- `GET /api/v1/ai/recommendations`: List pending recommendations requiring human review.
- `POST /api/v1/ai/recommendations/:id/approve`: Human approves AI recommendation.
- `POST /api/v1/ai/recommendations/:id/reject`: Human rejects AI recommendation.
