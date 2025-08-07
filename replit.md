# ICY - AI-Powered Influencer Outreach Platform

## Overview

ICY is an intelligent influencer marketing platform that automates the process of finding, analyzing, and reaching out to influencers for brand collaborations. The system uses AI to discover relevant influencers across multiple platforms, analyze their content for brand fit, and generate personalized outreach messages. The platform provides a comprehensive dashboard for managing campaigns, tracking outreach status, and analyzing influencer metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool and development server. The UI leverages the shadcn/ui design system built on top of Radix UI components for accessible and consistent interface elements. Styling is handled through Tailwind CSS with custom CSS variables for theming. State management uses TanStack Query (React Query) for server state and data fetching, providing optimistic updates and caching. Client-side routing is implemented with Wouter for lightweight navigation. The component structure follows a modular approach with separate UI components, business logic components, and page-level components.

### Backend Architecture  
The backend runs on Node.js with Express.js providing RESTful API endpoints. TypeScript is used throughout with ES modules for type safety and modern JavaScript features. The server implements proper error handling, request/response validation using Zod schemas, and logging middleware for API requests. The API follows RESTful conventions with clear separation of concerns between routes, services, and data access layers.

### Database Layer
Data persistence uses PostgreSQL with Neon serverless hosting for scalability. Drizzle ORM provides type-safe database operations with schema definitions shared between client and server. The database schema includes tables for users, brands, influencers, campaigns, and outreach messages with proper relationships and constraints. Migration support is handled through Drizzle Kit for schema versioning.

### AI Integration
The platform integrates Google's Gemini 2.0 Flash model for generating personalized outreach messages. The AI service analyzes influencer profiles, recent content, and brand information to create contextually relevant communications. The system includes fallback mechanisms and multiple template variations to ensure robust message generation.

### Email Service Integration
SendGrid integration handles automated email delivery for outreach campaigns. The service supports both text and HTML email formats with proper error handling and delivery tracking. Email templates are dynamically generated based on AI-created content and user preferences.

### Authentication & Session Management
User authentication uses session-based management with PostgreSQL session storage via connect-pg-simple. This provides secure, scalable session handling without requiring JWT tokens or external auth providers.

## External Dependencies

### Third-Party APIs
- **Google Gemini AI**: For generating personalized outreach messages and content analysis
- **YouTube Data API**: For discovering influencers and analyzing their content metrics  
- **SendGrid**: For automated email delivery and campaign management

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting for production scalability
- **Drizzle ORM**: Type-safe database operations and schema management

### UI and Development Tools
- **Radix UI**: Accessible component primitives for the user interface
- **shadcn/ui**: Pre-built component library with consistent design patterns
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Vite**: Fast build tool and development server with HMR support
- **TanStack Query**: Powerful data fetching and state management for React

### Runtime and Build Dependencies
- **Node.js**: JavaScript runtime environment
- **TypeScript**: Type safety and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **Wouter**: Lightweight client-side routing library