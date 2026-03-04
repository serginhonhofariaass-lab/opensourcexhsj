# SPEC.md - No Abraço do Pai - Site de Venda de Ingressos

## 1. Project Overview

**Project Name:** No Abraço do Pai
**Type:** Full-stack Web Application (E-commerce/Ticketing)
**Core Functionality:** A modern event ticketing platform where the admin creates events and users can purchase tickets via Mercado Pago
**Target Users:** Event organizers (admin) and event attendees (customers)

---

## 2. UI/UX Specification

### 2.1 Layout Structure

**Page Sections:**
- Cookie Banner (fixed top)
- Header (sticky below banner)
- Hero Section (homepage)
- Events Grid/Carousel
- Event Detail Page
- Footer (simple)

**Responsive Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 2.2 Visual Design

**Color Palette:**
- Background: #FFFFFF (white)
- Secondary Background: #F8F9FA (light gray)
- Primary Accent: #004642 (dark green)
- Secondary Accent: #E5D4C8 (beige)
- Cookie Banner: #FFEA00 (vibrant yellow)
- Text Primary: #1A1A1A (near black)
- Text Secondary: #6B7280 (gray)
- Success: #10B981 (green)
- Error: #EF4444 (red)

**Typography:**
- Headings: "Poppins", sans-serif (weight 600-700)
- Body: "Inter", sans-serif (weight 400-500)
- Logo: "Poppins", bold

**Spacing System:**
- Base unit: 4px
- Section padding: 64px vertical, 24px horizontal
- Card padding: 16px
- Component gap: 16px-24px

**Visual Effects:**
- Card shadows: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
- Header shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
- Border radius: 12px (cards), 8px (buttons), 24px (large images)
- Transitions: 200ms ease-in-out

### 2.3 Components

**Cookie Banner:**
- Background: #FFEA00
- Fixed position, top of page
- Text: "Utilizamos cookies para melhorar sua experiência..."
- Link to terms
- Close button (X icon)
- State: closes via React state, stored in localStorage

**Header:**
- Background: #FFFFFF
- Box shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
- Sticky position, z-index: 50
- Logo (left): Image + "No Abraço do Pai" text
- No search bar, no account button, no location

**Hero Section:**
- Large heading: "Criado para promover suas experiências"
- Subtext inviting users to discover events

**Event Cards:**
- Large rounded images (aspect ratio 16:9 or 4:3)
- No text on image
- Click leads to event detail page
- Horizontal carousel or grid (2-4 per row)

**Event Detail Page:**
- Large hero image
- Title, date, location, description
- Price prominently displayed
- Purchase form: name, email
- "Comprar" button ( Mercado Pago integration)

**Admin Panel:**
- Protected route (/admin)
- Login page with email/password
- Dashboard to create/edit/delete events
- Event form: title, date, location, description, price, image URL

---

## 3. Functionality Specification

### 3.1 Core Features

**Public Pages:**
1. Homepage - Display all events in carousel/grid
2. Event Detail - Show event info and purchase form
3. Success Page - Show after successful purchase
4. Cancel Page - Show if purchase is cancelled

**Admin Features:**
1. Admin Login (email/password)
2. Dashboard - List all events
3. Create Event - Form with all fields
4. Edit Event - Pre-filled form
5. Delete Event - With confirmation

**Purchase Flow:**
1. User clicks event → Event detail page
2. User fills name + email
3. User clicks "Comprar"
4. Redirect to Mercado Pago checkout
5. After payment → Success page with confirmation

### 3.2 Data Models

**Event:**
- id: string (UUID)
- title: string
- description: string
- date: DateTime
- location: string
- price: number (in cents)
- imageUrl: string
- createdAt: DateTime
- updatedAt: DateTime

**Ticket:**
- id: string (UUID)
- eventId: string (FK)
- buyerName: string
- buyerEmail: string
- mercadoPagoId: string
- status: enum (pending, approved, cancelled)
- createdAt: DateTime

**Admin:**
- id: string (UUID)
- email: string (unique)
- passwordHash: string
- createdAt: DateTime

### 3.3 API Routes

**Public:**
- GET /api/events - List all events
- GET /api/events/[id] - Get single event
- POST /api/checkout - Create Mercado Pago payment
- GET /api/webhook/mercado-pago - Payment webhook

**Admin (protected):**
- POST /api/admin/login - Admin login
- GET /api/admin/events - List events (admin)
- POST /api/admin/events - Create event
- PUT /api/admin/events/[id] - Update event
- DELETE /api/admin/events/[id] - Delete event

---

## 4. Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite with Prisma ORM
- **Styling:** Tailwind CSS
- **Payments:** Mercado Pago SDK
- **Authentication:** NextAuth.js (credentials provider for admin)
- **State Management:** React useState/useContext
- **Forms:** React Hook Form

---

## 5. Admin Credentials

- Email: serginhonhofariaass@gmail.com
- Password: 020312##

---

## 6. Acceptance Criteria

1. ✅ Cookie banner displays on first visit, closes and hides on close button click
2. ✅ Header is white with shadow, sticky below banner
3. ✅ Homepage shows events in responsive grid
4. ✅ Clicking event card navigates to event detail page
5. ✅ Event detail shows all info with purchase form
6. ✅ Purchase form validates name and email
7. ✅ "Comprar" button initiates Mercado Pago checkout
8. ✅ Admin can login at /admin
9. ✅ Admin can create, edit, delete events
10. ✅ All pages are responsive (mobile, tablet, desktop)
11. ✅ Design is clean, professional, inspired by Tiketo
