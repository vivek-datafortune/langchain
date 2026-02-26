# Enquiry Questions — Staff (clinic patients only)

Staff do **not** have their own data to query. They can only ask about **patients** (and their tests) that belong to their clinic (`clinic_id`). Access includes: look up patient by identifier, list patients, list and filter tests by date/value, and aggregate by data.

Schema involved: User, Test, Clinic, City, State, Country.

---

## Simple

- Find patient by name: "Show me details for patient named [X]."
- Find patient by email: "Get patient with email [X]."
- Find patient by phone: "Look up patient with phone number [X]."
- How many patients are in my clinic?
- List all patients in my clinic (name, phone, email).
- How many tests are there at my clinic?
- List all tests at my clinic (patient name, test type, hba1c, result, date).

---

## Medium

- Get full details of patient [name / email / phone]: profile (name, phone, email, gender, dob) and clinic.
- List patients in my clinic with their contact details (name, phone, email).
- List all tests at my clinic with patient name, test type, HbA1c, result, and date.
- List tests at my clinic **created after** [date].
- List tests at my clinic **created before** [date].
- List tests at my clinic **between** [date1] and [date2].
- List tests where **HbA1c is greater than** [value].
- List tests where **HbA1c is less than** [value].
- List tests where **HbA1c is between** [value1] and [value2].
- List tests at my clinic by **test type** (e.g. a specific test_type).
- How many tests were done at my clinic in [month/year]?
- Which patients at my clinic have tests? (names and test count.)
- Show me the most recent test for patient [name/email/phone].

---

## Complex

- Find patient by name/email/phone and list all their tests (test type, hba1c, result, date) at my clinic.
- List all tests at my clinic where **date is after [X]** and **HbA1c is greater than [Y]**.
- List all tests at my clinic where **date is before [X]** and **HbA1c is less than [Y]**.
- Give me tests at my clinic filtered by test_type and date range.
- List patients in my clinic with how many tests each has, ordered by test count.
- List tests at my clinic with HbA1c above [value], with patient name and date.
- Who at my clinic has the most recent HbA1c test, and what is the result?
- Summary for my clinic: total patients, total tests, and tests in the last [period].
- List all tests at my clinic ordered by date (most recent first), with patient name and HbA1c result.
- For patient [name/email/phone], show profile and all their tests with date and result; highlight latest HbA1c.
