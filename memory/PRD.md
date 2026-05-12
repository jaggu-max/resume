# ResumeAI - Premium AI Resume Builder SaaS

## Problem Statement
Build a complete premium Full Stack AI Resume Builder SaaS website with all features fully functional and production-ready, including auth, dashboard, editor, AI features, ATS checker, admin panel, and Indian UPI payment system.

## Architecture
- **Backend**: FastAPI + MongoDB (single server.py)
- **Frontend**: React + Tailwind + shadcn/ui + framer-motion + dnd-kit
- **AI**: Universal LLM integration (Claude/OpenAI - configure as needed)
- **Auth**: JWT (cookie + Bearer header) with bcrypt passwords + Google login stub
- **Payments**: Manual UPI flow (QR + UTR + screenshot upload + admin verification)
- **PDF**: Client-side via html2canvas + jsPDF; DOCX via docx package
- **Storage**: Base64 in MongoDB (5MB cap) for profile photos & screenshots

## Implemented (2026-02)
- Auth: register/login/logout/me/google + httpOnly cookies + Bearer token fallback
- Resumes CRUD with public share endpoint
- 9 templates (Modern, Minimal, Corporate, SE, DS, Fresher, Internship, Elegant, Creative)
- Drag-and-drop section reorder with @dnd-kit
- All 11 sections (personal, summary, exp, edu, skills, projects, certs, languages, achievements, interests, references) + custom
- Live preview on A4 paper with scaling, two-column for Modern/Corporate/DS/Creative
- Profile photo upload + display
- AI panel: Claude/GPT switcher, summary, improve, grammar, skills, keywords
- ATS Score Checker page with score gauge + matched/missing/suggestions
- Customization: accent color, font, font size, spacing, dark editor
- Downloads: PDF (html2canvas + jsPDF), DOCX (docx package), Print, Share link
- Admin Panel: payment queue with approve/reject + users table
- UPI Payment flow: QR (qrcode.react), UPI deep-link, UTR + screenshot submission
- Pricing page with Free/Pro/Premium plans
- Developer credit footer (Jagadeesh S Bentoor + Instagram)

## Test Credentials
- Admin: `admin@resumeai.com` / `Admin@12345`

## P1 Backlog
- Real Google OAuth (currently stub - prompts for email)
- PDF download with multi-page support polish
- Email notifications on payment approval
- Resume version history / templates marketplace

## P2 Backlog
- Image cropper modal (currently upload + display only)
- LinkedIn import
- Cover letter builder
