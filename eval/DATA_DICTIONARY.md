# Synthetic Dataset: Data Dictionary & Provenance

> **Capstone Project BCA-05**  
> **Target Dataset:** 200 Students, 40 Mentors  
> **Generation Seed:** 42 (Deterministic Reproducibility)  
> **File:** `eval/output/synthetic_dataset.json`

---

## 1. Provenance & Ethical Declaration

This dataset is **100% synthetically generated** using `eval/generate_synthetic.py`.
- **No Real Human Subjects:** Names are combinations of common regional naming lists paired with synthetic educational domains (`@synthetic.college.edu` and `@synthetic.alumni.org`).
- **No Private Data Scraped:** Skills and domains reflect standard BCA curriculum and technology job descriptions.
- **Purpose:** Used strictly for algorithmic benchmarking, stress testing, capacity allocation analysis, and AI explanation fidelity verification.

---

## 2. Entity Schemas

### 2.1 Student Entity (`students[]`)

| Field | Type | Description | Sample Value |
|---|---|---|---|
| `id` | String | Unique synthetic identifier | `"student_synth_001"` |
| `name` | String | Synthetic student full name | `"Aarav Sharma"` |
| `email` | String | Synthetic student email | `"student.aarav.sharma1@synthetic.college.edu"` |
| `role` | String | Role designation (`"student"`) | `"student"` |
| `college` | String | Academic institute division | `"Department of Computer Science & BCA"` |
| `course` | String | Degree programme | `"BCA"` |
| `year` | String | Academic year | `"3rd Year"` |
| `skills` | Array[String] | 2 to 5 technical skills | `["Python", "SQL", "React"]` |
| `interests` | Array[String] | Primary career domain interest | `["Web Development"]` |
| `goals` | Array[String] | Desired mentorship outcomes | `["Career guidance", "Project guidance"]` |
| `languages` | Array[String] | Communication languages | `["English", "Hindi"]` |
| `availability` | Array[String] | Available time slots (`Day HH:MM-HH:MM`) | `["Monday 17:00-20:00"]` |
| `profileComplete`| Boolean | Profile onboarding completion flag | `true` |

---

### 2.2 Mentor Entity (`mentors[]`)

| Field | Type | Description | Sample Value |
|---|---|---|---|
| `id` | String | Unique synthetic identifier | `"mentor_synth_001"` |
| `name` | String | Synthetic alumni mentor name | `"Pooja Iyer"` |
| `email` | String | Synthetic mentor email | `"mentor.pooja.iyer1@synthetic.alumni.org"` |
| `role` | String | Role designation (`"mentor"`) | `"mentor"` |
| `company` | String | Industry employer | `"Google"` |
| `jobTitle` | String | Professional designation | `"Senior Cloud Computing Specialist"` |
| `experience` | String | Industry tenure | `"7 years"` |
| `domain` | String | Core industry domain | `"Cloud Computing"` |
| `skills` | Array[String] | 3 to 7 verified technical skills | `["Cloud Computing", "AWS", "Python"]` |
| `interests` | Array[String] | Advisory focus domains | `["Cloud Computing"]` |
| `goals` | Array[String] | Mentorship offerings | `["Career guidance", "Interview preparation"]` |
| `languages` | Array[String] | Spoken languages | `["English", "Marathi"]` |
| `availability` | Array[String] | Weekly recurring availability windows | `["Wednesday 17:00-20:00", "Saturday 09:00-12:00"]` |
| `capacity` | Integer | Maximum concurrent student limit (1-5) | `3` |
| `currentMentees`| Integer | Active assigned mentee count | `0` (Initial) |
| `profileComplete`| Boolean | Profile onboarding completion flag | `true` |

---

## 3. Aggregate Characteristics

- **Total Students:** 200
- **Total Mentors:** 40
- **Total System Capacity:** 105 concurrent mentee slots (Mean capacity: 2.625 mentees/mentor)
- **Demand/Supply Ratio:** 200 students competing for 105 slots (Demand exceeds supply by 1.9x), establishing realistic competition where capacity-aware matching and allocation algorithms are crucial.
