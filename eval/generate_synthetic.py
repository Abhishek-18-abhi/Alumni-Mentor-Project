#!/usr/bin/env python3
"""
Synthetic Dataset Generator for Capstone Project BCA-05
"Explainable Alumni-Mentor Matching Marketplace with Capacity-Aware Recommendations"

Generates 200 synthetic students and 40 synthetic alumni mentors with controlled
skill distributions, career interests, availability windows, and mentor capacities.
Uses a deterministic random seed for strict scientific reproducibility.
"""

import json
import os
import random

SEED = 42
random.seed(SEED)

SKILLS_POOL = [
    "Python", "Java", "JavaScript", "React", "Node.js", "Django", "SQL",
    "PostgreSQL", "MySQL", "Data Analytics", "Data Science", "Machine Learning",
    "Artificial Intelligence", "Cloud Computing", "AWS", "Power BI", "Excel",
    "UI/UX", "Cybersecurity", "Software Engineering", "Mobile Development",
    "Business Intelligence", "Project Management"
]

DOMAINS_POOL = [
    "Web Development", "Data Science", "Software Engineering", "Cloud Computing",
    "AI / ML", "Cybersecurity", "Mobile Development", "Data Analytics", "UI/UX"
]

GOALS_POOL = [
    "Career guidance", "Technical skills", "Interview preparation",
    "Project guidance", "Industry knowledge", "Higher studies", "Networking"
]

LANGUAGES_POOL = ["English", "Hindi", "Marathi", "Gujarati", "Tamil"]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
TIME_SLOTS = ["09:00-12:00", "13:00-16:00", "17:00-20:00"]

FIRST_NAMES = [
    "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavna", "Chetan", "Devansh",
    "Diya", "Gaurav", "Isha", "Karan", "Kavya", "Manish", "Meera", "Neha",
    "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Rhea", "Rohan", "Sanjay",
    "Sneha", "Tanvi", "Varun", "Vikram", "Yash", "Zoya", "Aditya", "Divya",
    "Harsh", "Ishaan", "Komal", "Mayank", "Nisha", "Prasad", "Ritu", "Sahil"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Mehta", "Iyer", "Nair", "Patel", "Joshi",
    "Kulkarni", "Deshmukh", "Chopra", "Reddy", "Rao", "Bhat", "Saxena",
    "Trivedi", "Mishra", "Pandey", "Kapoor", "Malhotra"
]

COMPANIES = [
    "Google", "Microsoft", "Amazon", "Infosys", "Tata Consultancy Services",
    "Wipro", "Accenture", "Cognizant", "Zomato", "Swiggy", "JPMorgan Chase"
]

COLLEGES = [
    "Department of Computer Science & BCA",
    "School of Information Technology",
    "University Institute of Computing"
]

def generate_availability():
    slots_count = random.choices([1, 2, 3, 4], weights=[0.2, 0.4, 0.3, 0.1])[0]
    chosen_days = random.sample(DAYS, k=slots_count)
    return [f"{day} {random.choice(TIME_SLOTS)}" for day in chosen_days]

def generate_students(n=200):
    students = []
    for i in range(1, n + 1):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        skills_count = random.randint(2, 5)
        student_skills = random.sample(SKILLS_POOL, k=skills_count)
        interest = random.choice(DOMAINS_POOL)
        goals = random.sample(GOALS_POOL, k=random.randint(1, 3))
        languages = ["English"] + ([random.choice(LANGUAGES_POOL[1:])] if random.random() > 0.4 else [])

        students.append({
            "id": f"student_synth_{i:03d}",
            "name": f"{first} {last}",
            "email": f"student.{first.lower()}.{last.lower()}{i}@synthetic.college.edu",
            "role": "student",
            "college": random.choice(COLLEGES),
            "course": "BCA",
            "year": random.choice(["2nd Year", "3rd Year"]),
            "skills": student_skills,
            "interests": [interest],
            "goals": goals,
            "languages": languages,
            "availability": generate_availability(),
            "profileComplete": True,
        })
    return students

def generate_mentors(n=40):
    mentors = []
    for i in range(1, n + 1):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        domain = random.choice(DOMAINS_POOL)
        skills_count = random.randint(3, 7)
        mentor_skills = list(set([domain.split()[0]] + random.sample(SKILLS_POOL, k=skills_count)))
        capacity = random.choices([1, 2, 3, 4, 5], weights=[0.15, 0.35, 0.30, 0.15, 0.05])[0]
        goals = random.sample(GOALS_POOL, k=random.randint(2, 4))
        languages = ["English"] + ([random.choice(LANGUAGES_POOL[1:])] if random.random() > 0.3 else [])

        mentors.append({
            "id": f"mentor_synth_{i:03d}",
            "name": f"{first} {last}",
            "email": f"mentor.{first.lower()}.{last.lower()}{i}@synthetic.alumni.org",
            "role": "mentor",
            "company": random.choice(COMPANIES),
            "jobTitle": f"Senior {domain} Specialist",
            "experience": f"{random.randint(3, 12)} years",
            "domain": domain,
            "skills": mentor_skills,
            "interests": [domain],
            "goals": goals,
            "languages": languages,
            "availability": generate_availability(),
            "capacity": capacity,
            "currentMentees": 0,
            "profileComplete": True,
        })
    return mentors

def main():
    out_dir = os.path.join(os.path.dirname(__file__), "output")
    os.makedirs(out_dir, exist_ok=True)

    students = generate_students(200)
    mentors = generate_mentors(40)

    dataset = {
        "metadata": {
            "project": "BCA-05: Explainable Alumni-Mentor Matching Marketplace",
            "generator": "eval/generate_synthetic.py",
            "seed": SEED,
            "studentsCount": len(students),
            "mentorsCount": len(mentors),
            "totalCapacity": sum(m["capacity"] for m in mentors),
            "averageCapacityPerMentor": round(sum(m["capacity"] for m in mentors) / len(mentors), 2),
            "provenance": "100% synthetically generated for academic evaluation. Zero real personally identifiable information."
        },
        "students": students,
        "mentors": mentors,
    }

    out_file = os.path.join(out_dir, "synthetic_dataset.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    print(f"Generated {len(students)} students and {len(mentors)} mentors.")
    print(f"Total mentor capacity: {dataset['metadata']['totalCapacity']} slots.")
    print(f"Saved dataset to {out_file}")

if __name__ == "__main__":
    main()
