# AgriTech — Premium Digital Farming SaaS Platform
**B.Tech Computer Science Capstone Project & Agricultural Intelligence Platform**

AgriTech is a production-grade, mobile-first agricultural SaaS platform engineered for Indian smallholders and progressive growers. It combines deterministic agronomic rule processing, on-device EXIF-sanitized plant pathology, Open-Meteo microclimate telemetry, Firebase Authentication (Google Sign-In & Email/Password), and grounded Google Gemini AI assistance into an integrated, glassmorphism-styled web application.

---

## 1. What Is Implemented

1. **Design System & Visual Architecture:**
   - **Glassmorphism & Depth:** Translucent surfaces, backdrop blur (`backdrop-blur-xl`), delicate borders, subtle botanical depth, and restrained shadows.
   - **Core Palette:** Deep forest green (`#0E291D`), emerald (`#10B981` / `#059669`), warm ivory (`#FDFBF7`), muted sage (`#8EA89D`), and amber accents (`#F59E0B`).
   - **Editorial Hierarchy:** Font pairings (`Outfit` for headings and `Plus Jakarta Sans` for body) with generous spacing and WCAG AA contrast.
   - **Dedicated SaaS App Shell (`AppLayout.tsx`):**
     - Collapsible desktop sidebar (260px <-> 64px) and mobile navigation drawer.
     - Top application header with dynamic page titles, farm location context, bilingual language switch (EN/HI), functional notifications popover, and farmer profile menu.
     - 4-Day rainfall outlook progress bars and soil moisture trend visualizations.

2. **Google Sign-In & Firebase Authentication:**
   - **Multi-Provider Authentication:** Polished "Continue with Google" button with official multi-color Google 'G' mark alongside traditional email/password login and registration.
   - **Firebase SDK Client:** Initialized via `firebase-applet-config.json` with `GoogleAuthProvider` configured for popup authentication (`signInWithPopup`).
   - **Server-Side Token Verification:** Express server validates Firebase ID tokens using `firebase-admin` with automatic user profile creation and session synchronization.
   - **Data Isolation:** User ID is derived exclusively from verified cryptographic tokens; client-supplied IDs are never trusted.
   - **Error Handling:** Gracefully catches popup-blocked, popup-closed, unauthorized-domain, and provider-disabled events with friendly user feedback.

3. **Core Pages & Modules:**
   - **Landing Page (`/`):** Striking hero section with layered glass panels, interactive illustrative agronomy simulator, 3-step workflow diagram, modular feature cards, ethical guardrails disclaimer, and conversion CTA.
   - **Authentication (`/login`, `/signup`):** Accessible form fields, Google authentication, field-level error messages, and password visibility toggles.
   - **5-Step Onboarding Wizard (`/onboarding`):** Language selection, state and district selection, operational land area, soil classification, irrigation infrastructure, and farming interests.
   - **Farmer SaaS Dashboard (`/dashboard`):** Personalized seasonal greeting, 4-day Open-Meteo rainfall outlook chart, "Next Critical Agronomic Action" card, crop suitability status, disease screening status, and quick action shortcuts.
   - **Crop Recommendation Wizard (`/crops`):** Deterministic rules engine mapping soil, season, and irrigation to verified ICAR crops, transparent rule audit logs ("Why this recommendation?"), and Gemini plain-language explanations.
   - **Plant Disease Diagnostics (`/disease`):** Upload or camera capture (`accept="image/*" capture="environment"`), on-device canvas EXIF sanitization, 5MB/format validation, structured JSON symptoms, qualitative certainty levels, and prominent Krishi Vigyan Kendra disclaimer.
   - **Bilingual Farming Assistant (`/assistant`):** Contextual AI advisory in English or Hindi, strict refusal of chemical pesticide dosages, and HTTP 503 handling when unconfigured.
   - **Weather & Irrigation Guidance (`/weather`):** Current conditions, 3-day forecast, dynamic irrigation tip (`DELAY`, `MONITOR`, `PROCEED`), and 30-minute server-side caching.
   - **Verified Resource Center (`/resources`):** Curated agronomy guides and official links to PM-KISAN, PMFBY, and Soil Health Card portals with verification badges.
   - **Mandi Price Benchmarks (`/market`):** Sample reference table with search, commodity filter, and Quintal-to-Kg conversion.
   - **Farmer Profile & Privacy (`/profile`):** Edit all field parameters and permanent "Delete My Data" account purge feature.

---

## 2. Firebase Configuration & Required Action Items

### Firebase Project Provisioned
- **Project ID:** `sunny-canopy-m5v9p`
- **Firestore Database ID:** `ai-studio-agritech-ecbf27a9-38bb-4031-9aa7-316edb444216`
- **Auth Domain:** `sunny-canopy-m5v9p.firebaseapp.com`
- **Web App ID:** `1:578818801636:web:cb9acfa1d311f4384f11f1`

### Action Required in Firebase Console:
1. **Enable Google Provider in Firebase Console:**
   - Navigate to [Firebase Console > Authentication > Sign-in method](https://console.firebase.google.com/project/sunny-canopy-m5v9p/authentication/providers).
   - Under **Sign-in providers**, click **Google**, toggle **Enable**, set your project support email, and click **Save**.
2. **Authorize App Domains:**
   - Under [Firebase Console > Authentication > Settings > Authorized domains](https://console.firebase.google.com/project/sunny-canopy-m5v9p/authentication/settings), verify the following domains are listed:
     - `ais-dev-g3tjxz2sfl2wqjzxjj32ob-787890689027.asia-northeast1.run.app`
     - `ais-pre-g3tjxz2sfl2wqjzxjj32ob-787890689027.asia-northeast1.run.app`
     - `localhost`
3. **Firestore Security Rules:**
   - `firestore.rules` is generated in the repository root. To deploy rules via Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules --project sunny-canopy-m5v9p
     ```

---

## 3. What Is Demo or Sample Data

- **Mandi Benchmark Prices (`/market`):** The commodity rates displayed on the Mandi Prices page are sample reference data for academic demonstration and do not reflect live physical auction rates.
- **Hero Interactive Simulator:** The interactive season-soil switcher on the landing page is explicitly labeled *"Illustrative Preview"* to demonstrate deterministic rule logic.
- **Government Scheme Verification:** Links point directly to official portals (`pmkisan.gov.in`, `pmfby.gov.in`, `soilhealth.dac.gov.in`). Items verified are marked with verification dates; unverified portals are explicitly labeled *"Unverified — check the official portal"*.

---

## 4. Environment Variables

Create a `.env` file using `.env.example` as a template:

```bash
# GEMINI_API_KEY: Required for Gemini AI calls (crop explanation, disease analysis, assistant)
GEMINI_API_KEY="your-gemini-api-key"

# GEMINI_MODEL: Model alias (default: gemini-3.8-flash)
GEMINI_MODEL="gemini-3.8-flash"

# Application Settings
APP_NAME="AgriTech"
PORT=3000
JWT_SECRET="your-secure-jwt-signing-key"
```

---

## 5. How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   The application runs at `http://localhost:3000`.

3. **Verify build and types:**
   ```bash
   npm run lint
   npm run build
   ```
