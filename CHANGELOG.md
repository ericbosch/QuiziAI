# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] - 2026-01-24

### Changed
- Marked project status as alpha and aligned documentation with current architecture
- Documented queue-based batching, dual-timer gameplay, and provider fallback flow
- Updated test/coverage reporting to include 145 unit + 6 E2E tests (1 live AI test skipped by default)

## [0.1.0] - 2026-01-22

### Added
- Initial release of QuiziAI - AI-powered trivia game
- Mobile-first responsive design with dark theme
- Category selection system with 8 categories (History, Science, Cinema, Geography, Sports, Literature, Art, Music)
- 120 curated Spanish topics across all categories
- Multi-provider AI fallback system (Gemini → Groq → Hugging Face)
- Wikipedia integration with multiple fallback data sources
- 10-second timer with auto-advance and manual skip
- Question diversity tracking to avoid duplicates
- File logging system (`logs/quiziai.log`) with automatic rotation
- Comprehensive test coverage (60+ test cases)
- Mobile testing infrastructure (ngrok setup, WSL2 support)
- Complete documentation (README, troubleshooting guides, setup scripts)

### Features
- **Game Flow**: Infinite trivia generation from selected topics
- **Category Selection**: Quick play with curated topics or manual input
- **AI Providers**: Automatic failover on quota exceeded
- **Data Sources**: Wikipedia (Spanish/English) + DuckDuckGo fallback
- **UI/UX**: Thumb-friendly buttons, progress bar, visual feedback
- **Logging**: Dual logging to console and file

### Technical
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS for styling
- Jest + React Testing Library for testing
- Server actions for AI generation
- Client-side data fetching for Wikipedia
