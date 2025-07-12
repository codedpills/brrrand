# Copilot Instructions for Brrrand Project

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilot-instructionsmd-file -->

This is the Brrrand project - a modern web application for extracting brand assets from websites.

## Project Context
- **Project Name**: Brrrand
- **Type**: Web Application - Brand Asset Extraction Tool
- **Created**: July 12, 2025
- **Target Users**: Design agencies, marketing agencies, freelance designers

## Tech Stack & Conventions
- **Frontend**: TanStack Router, TypeScript, Tailwind CSS, Shadcn UI
- **Testing**: Vitest, Testing Library (TDD approach)
- **Analytics**: Google Analytics 4, Google Tag Manager
- **Monitoring**: Web Vitals, Custom Error Tracking
- **Build Tool**: Vite
- **Package Manager**: npm/pnpm

## Design Guidelines
- **Color Palette**: Pink, black, and white primary colors
- **Typography**: Playful and modern fonts that appeal to designers
- **UI Style**: Clean, modern, stylish with mobile-responsive design
- **Illustrations**: Colorful and playful illustrations from free sites matching the palette
- **Target Aesthetic**: Attractive to designers and ad agencies

## Development Instructions for Copilot
- Always follow TDD approach - write tests first using Vitest and Testing Library
- Use TypeScript strictly with proper type definitions
- Implement responsive design patterns with Tailwind CSS
- Use Shadcn UI components as the foundation for all UI elements
- Follow TanStack Router patterns for navigation and routing
- Prioritize performance - assets should be scraped and presented without server storage
- Write concise, SEO-friendly copy that's fun and playful
- Always include proper error handling and loading states
- Follow accessibility best practices (WCAG guidelines)
- Implement comprehensive analytics tracking using GA4 and GTM
- Include privacy-compliant data collection with user consent
- Track custom events for user journeys and asset interactions
- Monitor Core Web Vitals and performance metrics

## Code Standards
- Use functional components with hooks
- Implement proper error boundaries
- Use consistent naming conventions (camelCase for variables, PascalCase for components)
- Write comprehensive unit and integration tests
- Comment complex logic, especially web scraping and asset extraction functions
- Use semantic HTML elements
- Implement proper TypeScript interfaces for all data structures

## Key Features to Consider
- Website URL input and validation
- Brand asset extraction (logos, colors, typography, illustrations)
- Asset preview functionality
- Individual and bulk download options
- Mobile-responsive design
- Clean error handling and user feedback
