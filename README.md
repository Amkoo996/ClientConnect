<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ClientConnect

A modern client management and ticketing system built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

- **Authentication**: Google Sign-in via Firebase Auth
- **Role-based Access**: Admin and Client roles with different permissions
- **Ticket Management**: Create, view, and manage support tickets
- **Real-time Updates**: Live notifications and ticket updates
- **Comments**: Discussion threads on tickets
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Build Tool**: Vite 6
- **UI Icons**: Lucide React
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase account
- Google Cloud project (for authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amkoo996/ClientConnect.git
   cd ClientConnect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Firebase configuration values.

4. Set up Firebase:
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication with Google provider
   - Create a Firestore database
   - Deploy the security rules from `firestore.rules`
   - Copy your Firebase config to `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin

The first user with email `reddemption19@gmail.com` will automatically be assigned the ADMIN role. All other users will be assigned the CLIENT role by default.

## Project Structure

```
ClientConnect/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin-only pages
│   │   └── client/     # Client-only pages
│   ├── schemas/        # Zod validation schemas
│   ├── services/       # Firebase service functions
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main app component
│   ├── firebase.ts     # Firebase configuration
│   └── main.tsx        # Entry point
├── firestore.rules     # Firebase security rules
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Remove build directory

## User Roles

### Admin
- View all tickets from all clients
- Update ticket status
- Manage clients (view, deactivate)
- Send client invitations
- Receive notifications for new tickets

### Client
- Create new support tickets
- View own tickets
- Comment on tickets
- Receive notifications for replies

## Ticket Statuses

- **NEW** - Ticket just created, awaiting review
- **IN_PROGRESS** - Being worked on by admin
- **RESOLVED** - Issue has been resolved

## Ticket Categories

- **BUG** - Something is not working
- **FEATURE** - New functionality request
- **BILLING** - Payment or invoice issues
- **GENERAL** - Other inquiries

## License

MIT
