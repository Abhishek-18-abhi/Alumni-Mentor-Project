# Student & Alumni Mentor User Guide

> **Capstone Project BCA-05: MentorConnect**  
> Explainable Alumni-Mentor Matching Marketplace with Capacity-Aware Recommendations

---

## 1. Student User Journey

### 1.1 Account Setup & Onboarding
1. Navigate to `/register` and choose **Student**.
2. Fill in your College, Course (e.g. BCA), Academic Year, and Profile Bio.
3. Select your core **Technical Skills** (e.g. React, Node.js, Python), **Career Interests**, and **Desired Goals**.
4. Set your weekly recurring **Availability Windows** (e.g. `Monday 17:00-20:00`).

### 1.2 Discovering Mentors & Understanding Scores
1. Open **Find Mentors** or **My Matches**.
2. Mentors are automatically ranked using our **Explainable Matching Engine**.
3. Click on any mentor card to view the **Match Factor Breakdown**:
   - **Skills Overlap (45%):** Exact shared skills.
   - **Interests (20%):** Career domain alignment.
   - **Goals (15%):** Growth target compatibility.
   - **Languages (10%):** Common communication languages.
   - **Availability (5%):** Schedule overlap.
   - **Capacity (5%):** Availability of active mentorship slots.
4. Click **"Why this mentor (AI Explanation)"** for an instant natural-language rationale grounded in these factors.

### 1.3 Requesting Mentorship
1. Click **"Request Mentorship"** on the mentor's profile.
2. Enter a brief personal message explaining your goals.
3. The server computes an immutable, audited match snapshot.
4. Track the request status in **My Requests** (`Pending`, `Accepted`, or `Declined`).

### 1.4 Booking Meetings & Goal Tracking
1. Once accepted, navigate to **Schedule Meeting**.
2. Select an available time slot matching your mentor's published availability.
3. Track your development milestones in **My Goals**. Click **"AI Goal Suggestions"** to receive recommended SMART milestones tailored to your career targets.
4. After each meeting, submit a quick **Session Micro-Survey** rating usefulness, clarity, and comfort.

---

## 2. Alumni Mentor User Journey

### 2.1 Capacity & Availability Configuration
1. Register or sign in as an **Alumni Mentor**.
2. Navigate to **Availability**:
   - Add your weekly recurring mentorship windows (e.g. `Saturday 09:00-12:00`).
   - Define your **Maximum Mentee Capacity** (e.g. 2 or 3 active students).
   - If your schedule becomes busy, toggle **"Pause new mentorship requests"** to temporarily hide your profile from matchmaking without disrupting current mentees.

### 2.2 Managing Requests
1. Open **Mentorship Requests** from the sidebar.
2. View pending student applications.
3. Click **"AI Request Summary"** on any request card to read an executive digest highlighting the student's key focus and compatibility.
4. Click **Accept** or **Decline**. The backend strictly prevents accepting more students than your declared capacity.

### 2.3 Conducting Sessions & Session Logs
1. View your upcoming sessions in **Meetings**.
2. After completing a session, click **"Record Session Notes"** to capture:
   - Key discussion takeaways
   - Milestones achieved
   - Agreed next steps
