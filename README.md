# Holistic Health Tracker

A comprehensive health treatment management application built during Nuggethacks, a 6-hour internal hackathon, enhanced with AI-powered treatment recommendations!

## 🌟 Features

- **Treatment Management**: Track pharmaceutical and lifestyle treatments for multiple health conditions
- **Smart Recurrence**: Support for daily, weekly, and monthly treatment schedules
- **Completion Tracking**: Mark treatments as complete and view completion history
- **Condition Dashboard**: Organized view of treatments by medical condition
- **Calendar Integration**: Visual date selection for viewing and tracking treatments
- **Adaptive UI**: Treatments automatically appear based on their frequency schedule
- **AI Treatment Suggestions**: Evidence-based treatment recommendations using RAG technology
- **Medical Knowledge Base**: Built on MedlinePlus data with semantic search capabilities
- **Test Data Generation**: Built-in system to create sample data for testing

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **UI Components**: Shadcn UI with Tailwind CSS
- **Authentication**: Firebase Authentication
- **User Database**: Firebase Firestore
- **Vector Database**: Supabase with pgvector for semantic search
- **AI Integration**: OpenAI embeddings and LLM for treatment recommendations
- **Hosting**: Vercel

## 🚀 Getting Started

First, configure environment variables:

```bash
# Create .env.local with required variables for Firebase, Supabase and OpenAI
cp .env.example .env.local
# Fill in your API keys and configuration
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## 🔜 Future Enhancements

- **Email Notifications**: Automated reminders for treatment adherence
- **Weekly/Monthly Reports**: Summaries of treatment completion and effectiveness
- **Mobile App**: Native mobile experience using React Native
- **Treatment Effectiveness Tracking**: AI analysis of which treatments work best
- **Personalized Treatment Plans**: ML-based optimization of treatment combinations

## 🔄 Deployment

The app is configured for deployment on Vercel for the frontend, Firebase for user data, and Supabase for the vector database.

```bash
# Deploy to Vercel
vercel
```

## 📚 Data Attribution

This application utilizes health information from MedlinePlus.gov, a service of the National Library of Medicine (NLM). The treatment recommendations and medical knowledge base are derived from MedlinePlus content through their API. For more information about using MedlinePlus data and API guidelines, please visit NLM's [API page](https://eresources.nlm.nih.gov/nlm_eresources/?_gl=1*1mjx34l*_ga*MTA1MTkyODY1Mi4xNzQyNzk4MDI3*_ga_7147EPK006*MTc0Mjk1MDcxNi42LjEuMTc0Mjk1MDc1MC4wLjAuMA..*_ga_P1FPTH9PL4*MTc0Mjk1MDcxNi42LjEuMTc0Mjk1MDc1MC4wLjAuMA..).
