# Enquiry Questions — Patient (clinic-scoped)

Patient can ask about **clinic details** (the clinic they belong to) and **their own** data at that clinic. They do **not** get to list or see other users (staff or patients) at the clinic.

Schema involved: User, Test, Clinic, City, State, Country.

---

## Simple

- What is my clinic's name?
- What is my clinic's email and phone number?
- Where is my clinic located? (city, state, country)
- Is my clinic active?
- What is my clinic's full address?

---

## Medium

- What is my clinic's full address? (clinic name, city name, state name, country name)
- Give me my clinic's contact details and location.
- Do I have any tests at my clinic?
- How many tests do I have at my clinic?
- List my tests at my clinic (test type, hba1c, result, date).

---

## Complex

- Give me a summary of my clinic: name, contact, and full address (city, state, country).
- List all my tests at my clinic with date, test type, HbA1c value, and result; order by most recent.
- What is my latest HbA1c value and test type at my clinic?
- For my clinic, what is the full address and how many of my own tests are there?
