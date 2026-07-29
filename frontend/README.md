# AlphaAsk Frontend Application

Modern React 19 + TypeScript frontend for the **AlphaAsk** AI student support platform. Built with Vite, Lucide React icons, and modern responsive CSS design tokens.

---

## Features

- **Interactive AI Chat Interface**: Instant academic Q&A with live thinking indicator and subject quick-selector chips (Math, Science, Writing, Code, History, Study).
- **Authentication**: Modal dialogs for Student Registration & Login, with JWT session handling.
- **Session History & Sidebar**: Saved conversation threads, active session switching, and searchable past conversations.
- **Question Management**: Modal to inspect, search, and delete past submitted questions & answers.
- **Interactive FAQ**: Categorized searchable frequently asked questions.
- **Theme Switcher**: Smooth Dark/Light mode toggle.

---

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Configuration

To point the frontend to a remote API Gateway endpoint in production, create a `.env.production` file:

```env
VITE_API_URL=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com
```

### Production Build

```bash
npm run build
```
Generates production static assets in `dist/`, ready for S3 & CloudFront deployment.
