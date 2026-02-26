We already have working backend APIs:
- register
- login

Do NOT redefine API request/response structures.
Just integrate login.

We are implementing a production-ready frontend architecture using:

- @tanstack/react-query
- axios
- react-cookie
- zustand
- framer-motion

Everything must be clean, scalable, and modular.

==================================================
DEPENDENCIES
==================================================

Ensure project includes:

- @tanstack/react-query
- axios
- react-cookie
- zustand
- framer-motion

==================================================
GLOBAL ARCHITECTURE
==================================================

Use:

- React Query → server state (API calls)
- Zustand → UI & auth state
- react-cookie → token persistence
- Axios instance → centralized API client

Do NOT mix responsibilities.

==================================================
AXIOS SETUP
==================================================

Create:

client/src/lib/api.ts

Requirements:

1) Create axios instance with:
   - baseURL configured
   - withCredentials: true

2) Request interceptor:
   - Read medivoice_token from cookie
   - If exists → attach Authorization header

3) Response interceptor:
   - Handle 401 globally (clear auth state placeholder)

Export configured axios instance.

No direct axios usage in components.

==================================================
ZUSTAND STORE
==================================================

Create:

client/src/store/authStore.ts

State:

- isAuthenticated
- showPhoneInput
- phoneNumber

Actions:

- setAuthenticated()
- setShowPhoneInput()
- setPhoneNumber()
- resetPhoneInput()

Auth state must depend on cookie presence at initialization.

Zustand manages UI + auth state only.
React Query handles API status.

==================================================
REACT QUERY SETUP
==================================================

Wrap app in QueryClientProvider.

Configure:

- retry: false for login
- sensible defaults
- no unnecessary refetch

==================================================
AUTH STORAGE (react-cookie)
==================================================

Use react-cookie.

Cookie:

- Name: medivoice_token
- Path: "/"
- Expiration: 7 days

Do NOT use localStorage.

On login success:
- Store token in cookie
- Update Zustand auth state

On 401:
- Remove cookie
- Reset Zustand auth state

==================================================
VOICE TRIGGER FLOW
==================================================

When user says:
"Hi there"

System must:

1) Check if cookie exists
2) If token exists → continue assistant normally
3) If token does NOT exist → set showPhoneInput = true in Zustand

==================================================
PHONE INPUT UI
==================================================

- Centered glassmorphic card
- 10 OTP-style digit boxes
- Auto focus next input
- Backspace support
- Allow typing OR voice digit input
- Prevent more than 10 digits

Voice digit parsing:

zero → 0
one → 1
two → 2
three → 3
four → 4
five → 5
six → 6
seven → 7
eight → 8
nine → 9

When phoneNumber.length === 10:
→ Trigger login mutation

==================================================
REACT QUERY LOGIN MUTATION
==================================================

Use useMutation.

Requirements:

- retry: false
- Use centralized axios instance

On success:
- Store token in cookie
- setAuthenticated(true)
- setShowPhoneInput(false)

On error:
- Trigger failure animation ONLY
- Do NOT show error text
- resetPhoneInput()

Prevent duplicate calls while loading.

==================================================
FRAMER MOTION ANIMATIONS
==================================================

Phone Card Entrance:
- opacity: 0 → 1
- y: 20 → 0
- scale: 0.95 → 1
- duration: 0.4s
- ease: easeOut

Digit Fill:
- scale: 1 → 1.15 → 1
- duration: 0.2s

Processing:
- Card scale: 1 → 0.98
- Background blur increases slightly
- Mic orb shows rotating spinner
- Input disabled

Failure:
- Shake animation:
    x: -6 → 6 → -6 → 0
- Red border glow pulse
- Slight digit flash
- Clear input after animation

Success:
- Phone card fades out
- Assistant returns to listening state

==================================================
ARCHITECTURE RULES
==================================================

- No direct axios in components
- No localStorage
- Clean separation:
    - api layer
    - zustand store
    - UI component
- Clean useEffect separation
- Cleanup speech listeners
- Avoid unnecessary re-renders
- Code must be production clean

==================================================
DELIVERABLE
==================================================

Generate:

1) client/src/lib/api.ts
2) client/src/store/authStore.ts
3) Updated MediVoicePage.tsx using:
   - zustand
   - react-query mutation
   - react-cookie
   - framer-motion
   - centralized axios