# API Test Cases — `POST /api/reply`

**Endpoint:** `POST http://localhost:5001/api/reply`  
**Headers:** `Content-Type: application/json`  
**Body:** `{ "content": "<text>" }`

---

## 😐 Neutral

> Simple greetings, generic messages with no clear intent.  
> **Expected:** `reply` only, no ticket.

```json
{ "content": "Hi there!" }
```
```json
{ "content": "Hello, I'd like some help please." }
```
```json
{ "content": "Hey, just checking in." }
```
```json
{ "content": "Good morning." }
```
```json
{ "content": "I'm not sure what I need, just browsing." }
```

---

## 💬 Feedback

> Suggestions, feature requests, bug reports, product opinions.  
> **Expected:** `reply` + `ticket` (status: Open, priority: Low).

### Feature Request
```json
{ "content": "I think Alexa should support custom wake words beyond the four default ones." }
```
```json
{ "content": "It would be great if the Echo Show had a built-in calendar view on standby mode." }
```
```json
{ "content": "You should add support for more music services like YouTube Music." }
```

### Bug Report
```json
{ "content": "The Alexa app keeps crashing whenever I try to open my routines on iOS 17." }
```
```json
{ "content": "My Echo Dot randomly disconnects from Wi-Fi every few hours even though the signal is strong." }
```
```json
{ "content": "Alexa gives wrong answers when I ask about the weather in cities outside the US." }
```

### Suggestion / Improvement
```json
{ "content": "I think the voice response in Brief Mode is too abrupt. A little more warmth would be nice." }
```
```json
{ "content": "Alexa should remember my preferences across sessions, like my preferred music volume." }
```
```json
{ "content": "The multi-room audio sync has a noticeable delay between rooms. Would love to see that improved." }
```

---

## 😡 Angry — With Complaint (ticket expected)

> Clear frustration AND a specific, actionable problem.  
> **Expected:** `reply` (apology + escalation) + `ticket` (status: Open, priority: **High**).

```json
{ "content": "This is absolutely unacceptable! I was charged twice for my Amazon Music subscription and nobody is fixing it!" }
```
```json
{ "content": "I am furious. My Echo Show screen cracked after barely two weeks of normal use. This is a manufacturing defect and I demand a replacement!" }
```
```json
{ "content": "I hate this device. I set up a Routine to lock my front door every night and it has NEVER worked. I've been leaving my house unlocked for weeks!" }
```
```json
{ "content": "This is the worst customer experience I've ever had. My order arrived broken and support has ignored my emails for 10 days!" }
```
```json
{ "content": "Outrageous! Alexa ordered something I never asked for and now I can't get a refund. This is a serious problem with voice purchasing!" }
```

---

## 😡 Angry — Pure Venting (no ticket)

> Frustration with no specific actionable complaint.  
> **Expected:** `reply` (apology only), **no ticket**.

```json
{ "content": "Ugh, Alexa is SO annoying sometimes!!!" }
```
```json
{ "content": "I hate this thing, it never understands me." }
```
```json
{ "content": "This is terrible, I'm so frustrated right now." }
```
```json
{ "content": "Worst. Device. Ever. I regret buying this." }
```
```json
{ "content": "I'm disgusted with Amazon in general." }
```

---

## 🔍 Enquiry

> Questions about features, specs, compatibility, setup, pricing.  
> **Expected:** `reply` grounded in product DB, no ticket.

### Device Specs
```json
{ "content": "What is the speaker configuration of the Echo Studio?" }
```
```json
{ "content": "How many microphones does the Echo Dot 5th Gen have?" }
```
```json
{ "content": "What is the screen size and resolution of the Echo Show 10?" }
```
```json
{ "content": "Does the Echo 4th Gen have a built-in Zigbee hub?" }
```
```json
{ "content": "What are the dimensions and weight of the Amazon Echo Pop?" }
```

### Audio & Music
```json
{ "content": "Does Alexa support Spotify? How do I connect it?" }
```
```json
{ "content": "Can I pair two Echo Studio speakers for stereo sound?" }
```
```json
{ "content": "What is the maximum audio quality supported by Echo Studio?" }
```
```json
{ "content": "Can the Echo Dot play music in multiple rooms at the same time?" }
```
```json
{ "content": "Does Alexa support Apple Music?" }
```

### Smart Home
```json
{ "content": "Which Alexa devices have a built-in Zigbee hub?" }
```
```json
{ "content": "How many smart home devices does Alexa support?" }
```
```json
{ "content": "Does Alexa support the Matter smart home standard?" }
```
```json
{ "content": "Can Alexa control my Philips Hue lights without a separate bridge?" }
```
```json
{ "content": "What protocols does Alexa smart home support?" }
```

### Routines & Automation
```json
{ "content": "How many actions can I add to a single Alexa Routine?" }
```
```json
{ "content": "Can Alexa routines use if/then conditional logic?" }
```
```json
{ "content": "What can trigger an Alexa Routine?" }
```

### Security
```json
{ "content": "What is Alexa Guard and how does it work?" }
```
```json
{ "content": "Can Alexa detect smoke alarms when I'm away from home?" }
```
```json
{ "content": "How much does Alexa Guard Plus cost?" }
```

### Skills & Voice Assistant
```json
{ "content": "How many Alexa Skills are available?" }
```
```json
{ "content": "Can Alexa recognise different voices in my household?" }
```
```json
{ "content": "What languages does Alexa support?" }
```
```json
{ "content": "What are the available wake words for Alexa?" }
```

### Shopping
```json
{ "content": "Can I use Alexa to order groceries from Amazon Fresh?" }
```
```json
{ "content": "How do I prevent Alexa from making accidental purchases?" }
```

---

## ⚠️ Edge Cases

### Validation errors (expect 400)
```json
{ "content": "" }
```
```json
{ "content": "   " }
```
```json
{}
```
```json
{ "content": 12345 }
```

### Ambiguous (LLM decides — good for checking confidence scores)
```json
{ "content": "I think the sound quality could be better but overall it's fine I guess." }
```
```json
{ "content": "How do I reset my Echo? I'm pretty annoyed it stopped working." }
```
```json
{ "content": "Why doesn't Alexa understand me? This is so frustrating. I just want to know if it supports Spotify." }
```
