# ExampleIQ

A ride-booking web application built with Next.js, featuring Google Maps integration, phone-based customer recognition, and responsive design.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Forms**: React Hook Form + Zod validation + `useController` pattern
- **HTTP Client**: Axios (shared instance with interceptors)
- **State Management**: Zustand
- **Database**: SQLite via better-sqlite3
- **Maps**: Google Maps JavaScript API (`@react-google-maps/api`)

## Features

### Responsive Booking Form
- Fully responsive from mobile to large screens
- Date/time and name fields stack vertically on small screens, side-by-side on larger ones
- Centered layout with adaptive max-width breakpoints

### Google Maps Integration
- **Places Autocomplete** for pickup, drop-off, and stop locations (restricted to US)
- **Distance Matrix** calculates estimated driving distance and travel time between pickup and drop-off
- Travel summary displayed in a card between the drop-off and contact sections

### Phone Number Customer Lookup
- On phone input blur, the app calls `GET /api/phone/[number]` to check if the customer exists in the database
- **Recognized customer**: displays "Welcome back, {firstName}!" greeting and auto-fills contact info; name/email fields are hidden
- **New customer**: prompts for first name, last name, and email (all required)
- Phone status resets when the user edits the number

### Input Validation (Zod)
- Pickup date cannot be in the past
- Phone number validated with flexible US format regex
- Conditional validation: name and email are required only when the phone is not recognized
- Passengers must be at least 1
- Location fields require a valid address selected from Google Places

### Mock API Submission
- Form submits to `POST /api/bookings`
- New contacts are saved to SQLite on submission
- On success, a modal displays the full booking summary: service type, schedule, pickup/drop-off addresses, distance, travel time, contact info, and passenger count

### Additional
- One-way / Hourly service type toggle
- Dynamic stop locations (add/remove) with Google Places Autocomplete
- Loading spinner on phone lookup and form submission
- Shadcn Dialog modal for booking confirmation

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Or create it manually with the following content:

```env
# Google Maps API Key
# Enable these APIs in Google Cloud Console:
#   - Maps JavaScript API
#   - Places API
#   - Distance Matrix API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**To get a Google Maps API key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Go to **APIs & Services > Library** and enable:
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
4. Go to **APIs & Services > Credentials > Create Credentials > API Key**
5. Copy the key into your `.env.local`

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    api/
      bookings/route.ts        # POST - submit booking, save contact
      phone/[number]/route.ts   # GET - look up phone number
    globals.css                 # Tailwind v4 theme (gold, navy colors)
    layout.tsx                  # Root layout with fonts
    page.tsx                    # Renders BookingForm
  components/
    booking-form.tsx            # Main form (responsive, all features)
    booking-modal.tsx           # Submission result dialog
    places-autocomplete.tsx     # Google Places Autocomplete input
    ui/                         # Shadcn UI primitives (do not edit)
  lib/
    axios.ts                    # Shared Axios instance
    db.ts                       # SQLite database init + helpers
    google-maps-provider.tsx    # Google Maps JS API loader
    utils.ts                    # cn() utility
  schemas/
    booking.ts                  # Zod schema with conditional validation
  store/
    auth-store.ts               # Zustand auth store (example)
data/
  exampleiq.db                  # SQLite database (auto-created on first run)
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/phone/[number]` | Look up a phone number. Returns `{ found: true, contact }` or `{ found: false }` |
| `POST` | `/api/bookings` | Submit a booking. Saves/updates the contact in SQLite and returns a booking confirmation |

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
