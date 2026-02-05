# Infrastructure & Data Sync Enhancement Plan

> **Created:** 2026-02-05
> **Status:** Planning
> **Estimated Phases:** 12

This document outlines a comprehensive plan for improving the Wraith frontend and Haunt backend infrastructure, including preloading, data synchronization, storage management, and server visualization.

---

## Table of Contents

1. [Phase 1: Preloading & Splash Screen](#phase-1-preloading--splash-screen)
2. [Phase 2: Error & Warning Cleanup](#phase-2-error--warning-cleanup)
3. [Phase 3: Database Sync Enhancement](#phase-3-database-sync-enhancement)
4. [Phase 4: Storage Management & Data Retention](#phase-4-storage-management--data-retention)
5. [Phase 5: Exchange Latency & Dominance](#phase-5-exchange-latency--dominance)
6. [Phase 6: Server Mesh Visualization](#phase-6-server-mesh-visualization)
7. [Phase 7: OTA Updates](#phase-7-ota-updates-expo)
8. [Phase 8: Desktop Application](#phase-8-desktop-application)
9. [Phase 9: Modify Position Leverage](#phase-9-modify-position-leverage)
10. [Phase 10: Portfolio Avatar Hashicons](#phase-10-portfolio-avatar-hashicons)
11. [Phase 11: Username Validation & Content Moderation](#phase-11-username-validation--content-moderation)
12. [Phase 12: Testing & Documentation](#phase-12-testing--documentation)

---

## Phase 1: Preloading & Splash Screen

### Overview
Create a preloading page that initializes critical connections and data before showing the main application. This ensures a smooth user experience and validates connectivity.

### Tasks

#### 1.1 Create Preloader Component
- [ ] Create `/src/components/preloader/Preloader.tsx` component
- [ ] Design animated loading UI with Wraith branding
- [ ] Add progress indicator showing current loading step
- [ ] Implement step-by-step status messages

#### 1.2 Connection Validation
- [ ] Test connection to active server (health check)
- [ ] Measure and display initial latency
- [ ] Handle connection failures with retry logic
- [ ] Show server selection if primary fails

#### 1.3 Server Discovery
- [ ] Trigger mesh server discovery on load
- [ ] Ping all discovered servers for latency
- [ ] Auto-select fastest server if enabled
- [ ] Cache server list to localStorage

#### 1.4 Authentication Check
- [ ] Check for existing session token
- [ ] Validate session with server (`/api/auth/me`)
- [ ] Auto-login if credentials exist
- [ ] Handle expired sessions gracefully

#### 1.5 Preload User Data (if authenticated)
- [ ] Fetch user profile from server
- [ ] Load portfolio list and active portfolio
- [ ] Preload open positions
- [ ] Preload pending orders
- [ ] Fetch account summary

#### 1.6 Preload Market Data
- [ ] Fetch global market metrics
- [ ] Load Fear & Greed index
- [ ] Preload top movers (gainers/losers)
- [ ] Initialize WebSocket connection

#### 1.7 Preference Sync
- [ ] Sync user preferences from server
- [ ] Apply theme preference
- [ ] Apply default timeframe preference
- [ ] Apply indicator preferences

#### 1.8 Integration
- [ ] Add PreloaderProvider context
- [ ] Wrap App with preloader gate
- [ ] Add skip option for development
- [ ] Add "Continue anyway" for slow connections

### Decisions Made
- **Preloader:** Always show with 1-2s minimum display time for branding
- **Progress:** Show detailed step-by-step progress

---

## Phase 2: Error & Warning Cleanup

### Overview
Audit and fix all console errors, TypeScript warnings, and deprecation notices across both frontend and backend codebases.

### Audit Results (2026-02-05)

#### Wraith Frontend Build
- **Status:** BUILD SUCCESS with 1 warning
- **Warning:** Chunk size > 500KB (index.js is 1.1MB gzipped to 316KB)
- **Action:** Consider code splitting

#### Wraith TypeScript Check
- **Status:** 44+ TypeScript errors
- **Primary Issues:**
  - Missing `@types/react-native-web` declarations
  - Unused `@ts-expect-error` directives in Ghost components
  - Test file importing non-existent module `../../hooks/useCryptoData`
  - `icon` prop doesn't exist on Button (should be `iconLeft`)
  - Implicit `any` types in several components

#### Wraith ESLint
- **Status:** ESLint v9 config migration needed
- **Action:** Create `eslint.config.js` for ESLint 9

#### Haunt Backend Clippy
- **Status:** 2 ERRORS, 17 warnings
- **Critical Errors:**
  - `no field 'bot_runner' on type 'Arc<AppState>'` in TUI dashboard
- **Warnings:**
  - 4 derivable_impls (TimeInForce, MarginMode, CostBasisMethod, OptionStyle)
  - 4 too_many_arguments in trading types
  - 1 redundant_closure
  - Multiple unused imports (SyncConflict, LiquidationEngine, etc.)
  - Multiple unused variables

#### Ghost Component Library Build
- **Status:** BUILD FAILED
- **Error:** `react-native-svg` Buffer import issue
- **Action:** Configure Vite to polyfill Buffer for browser

### Tasks

#### 2.1 Frontend (Wraith) - Critical Fixes
- [ ] Fix Button `icon` prop → `iconLeft` in AssetHeader.tsx:87
- [ ] Fix test file import path for useCryptoData
- [ ] Add `@types/react-native-web` or declaration file
- [ ] Remove unused `@ts-expect-error` directives

#### 2.2 Frontend (Wraith) - ESLint Setup
- [ ] Create `eslint.config.js` for ESLint v9
- [ ] Run full lint and fix issues

#### 2.3 Frontend (Wraith) - Bundle Optimization
- [ ] Implement code splitting for large chunks
- [ ] Consider lazy loading for non-critical routes

#### 2.4 Backend (Haunt) - Critical Fixes
- [ ] Fix `bot_runner` field error in TUI dashboard
- [ ] Remove unused imports in mod.rs
- [ ] Fix unused variables with underscore prefix

#### 2.5 Backend (Haunt) - Clippy Warnings
- [ ] Refactor derivable impl blocks to #[derive(Default)]
- [ ] Consider builder pattern for functions with too many args
- [ ] Replace redundant closure with function reference

#### 2.6 Ghost Library - Build Fix
- [ ] Configure Vite to handle Buffer polyfill
- [ ] Fix react-native-svg browser compatibility
- [ ] Remove unused @ts-expect-error directives

#### 2.7 Integration Testing
- [ ] Test all API endpoints for proper responses
- [ ] Verify WebSocket connections work correctly
- [ ] Test authentication flow end-to-end
- [ ] Test trading flow (place order, modify, cancel)

---

## Phase 3: Database Sync Enhancement

### Overview
Improve the existing sync mechanism to ensure all servers maintain consistent data with efficient backlog synchronization.

### Current Architecture
- Primary node: Osaka (authoritative for conflicts)
- Sync priorities: Orders (0) → Positions (1) → Portfolio (2) → Trades (3) → etc.
- Conflict resolution: PrimaryWins, LastWriteWins, Merge, Reject

### Tasks

#### 3.1 Backlog Synchronization
- [ ] Implement full historical sync for new nodes
- [ ] Add sync cursor checkpointing for resume capability
- [ ] Create batched backlog transfer (pagination)
- [ ] Add compression for large historical transfers
- [ ] Track sync progress percentage

#### 3.2 Sync Queue Optimization
- [ ] Implement priority queue with configurable weights
- [ ] Add batch coalescing (combine multiple updates to same entity)
- [ ] Implement delta compression for incremental updates
- [ ] Add circuit breaker for failing sync targets

#### 3.3 Conflict Resolution Enhancement
- [ ] Add conflict logging dashboard data
- [ ] Implement manual conflict resolution API
- [ ] Add conflict notification system
- [ ] Create conflict history retention policy

#### 3.4 Real-time Sync Monitoring
- [ ] Add sync lag metrics per node
- [ ] Create sync throughput dashboard data
- [ ] Implement sync health alerts
- [ ] Add per-entity-type sync stats

#### 3.5 Frontend Sync Status
- [ ] Show sync status in navbar/footer
- [ ] Add sync indicator to ServersCard
- [ ] Show "data may be stale" warning when behind
- [ ] Add manual sync trigger button

### Questions to Resolve
- [ ] **Q4:** How long should sync history be retained? (e.g., 30 days)
- [ ] **Q5:** Should users be notified of sync delays? Threshold?
- [ ] **Q6:** Should there be a "force sync" option for users?

---

## Phase 4: Storage Management & Data Retention

### Overview
Implement disk space management with configurable limits and automatic cleanup of old data.

### Tasks

#### 4.1 Storage Metrics
- [ ] Add database size tracking endpoint
- [ ] Track per-table storage usage
- [ ] Implement storage growth rate calculation
- [ ] Add projected "full" date estimation

#### 4.2 Backend Storage Management
- [ ] Add `STORAGE_LIMIT_MB` environment variable
- [ ] Implement storage check on startup
- [ ] Create background storage monitor task
- [ ] Add storage warning threshold (e.g., 80%)

#### 4.3 Automatic Data Cleanup
- [ ] Implement trade history retention policy
- [ ] Add configurable retention periods per entity type:
  - [ ] Trades: configurable (default 90 days)
  - [ ] Portfolio snapshots: configurable (default 180 days)
  - [ ] Prediction history: configurable (default 30 days)
  - [ ] Sync queue (completed): 7 days
  - [ ] Node metrics: 24 hours
- [ ] Create cleanup job scheduler
- [ ] Add cleanup logging and notifications

#### 4.4 User-Configurable Retention
- [ ] Add storage settings to user preferences
- [ ] Create Settings UI for storage management
- [ ] Allow manual data export before cleanup
- [ ] Add "Clear old data now" button

#### 4.5 Frontend Storage Display
- [ ] Show current database size in Settings
- [ ] Display storage limit and usage percentage
- [ ] Show retention policy settings
- [ ] Add storage usage breakdown by category

### Decisions Made
- **Default storage limit:** 30 GB per server
- **Cleanup:** Automatic with configurable retention periods
- **Data export:** Offer before cleanup for user data

---

## Phase 5: Exchange Latency & Dominance

### Overview
Track and display exchange connectivity metrics and trading volume distribution.

### Tasks

#### 5.1 Backend Exchange Latency Tracking
- [ ] Add latency measurement per exchange connection
- [ ] Track latency history (last 60 seconds)
- [ ] Calculate min/avg/max latency per exchange
- [ ] Store latency metrics in database
- [ ] Add `/api/market/exchange-latency` endpoint

#### 5.2 Per-Server Exchange Metrics
- [ ] Track which exchanges each server connects to
- [ ] Measure server→exchange latency per pair
- [ ] Identify "best server" per exchange
- [ ] Add to mesh status endpoint

#### 5.3 Exchange Dominance Tracking
- [ ] Aggregate volume data per exchange
- [ ] Calculate 24h volume share percentage
- [ ] Track dominance changes over time
- [ ] Add `/api/market/exchange-dominance` endpoint
- [ ] Include per-symbol dominance breakdown

#### 5.4 Frontend Exchange Latency Display
- [ ] Create ExchangeLatencyCard component
- [ ] Show latency per exchange with color coding
- [ ] Display "best server" recommendation per exchange
- [ ] Add to asset detail page

#### 5.5 Frontend Exchange Dominance Display
- [ ] Create ExchangeDominanceCard component
- [ ] Show pie/bar chart of volume distribution
- [ ] Add to dashboard or market overview
- [ ] Include historical dominance chart

### Decisions Made
- **Exchange dominance:** Both global (dashboard) AND per-symbol (asset detail)
- **Exchanges:** All currently supported exchanges
- **Update frequency:** TBD based on performance testing

---

## Phase 6: Server Mesh Visualization

### Overview
Create an interactive visualization showing server relationships, sync status, and network topology.

### Status: DEFERRED
The advanced mesh visualization components were implemented but removed due to:
- Backend `/api/sync/mesh-status` endpoint not yet implemented
- Existing `ServersCard` provides sufficient server status display
- Can be re-added when backend sync monitoring APIs are complete

### Tasks (Deferred)

#### 6.1 Network Topology Component
- [ ] Create `ServerMeshVisualization` component
- [ ] Design node-and-edge graph layout
- [ ] Show servers as nodes with status colors
- [ ] Show connections as edges with latency
- [ ] Animate data flow between nodes

#### 6.2 Prerequisites (Backend)
- [ ] Implement `/api/sync/mesh-status` endpoint
- [ ] Implement `/api/sync/queue` endpoint (exists but limited)
- [ ] Add historical sync session tracking
- [ ] Expose per-node sync health metrics

---

## Phase 7: OTA Updates (Expo)

### Overview
Implement Over-The-Air updates for mobile apps using Expo's update system, allowing users to receive bug fixes and new features without downloading from app stores.

### Tasks

#### 7.1 Expo Updates Setup
- [ ] Install and configure expo-updates package
- [ ] Set up EAS Update for production builds
- [ ] Configure update channels (production, staging, development)
- [ ] Set up automatic update checking on app launch

#### 7.2 Update Strategy
- [ ] Implement background update download
- [ ] Add update available notification
- [ ] Configure critical vs non-critical update handling
- [ ] Add "Update Now" button in Settings
- [ ] Implement rollback capability for failed updates

#### 7.3 Version Management
- [ ] Set up semantic versioning for updates
- [ ] Create release notes system
- [ ] Add update changelog display
- [ ] Track update adoption metrics

#### 7.4 Testing
- [ ] Test update flow on iOS
- [ ] Test update flow on Android
- [ ] Test rollback mechanism
- [ ] Verify critical update forcing

### Decisions Needed
- [ ] **Q18:** Update check frequency? (on launch, every X hours)
- [ ] **Q19:** Force update for breaking changes?
- [ ] **Q20:** Show release notes on update?

---

## Phase 8: Desktop Application

### Overview
Build native desktop applications for Windows, macOS, and Linux using Tauri or Electron, with installers available for download.

### Tasks

#### 8.1 Desktop Framework Setup
- [ ] Evaluate Tauri vs Electron (Tauri recommended for size/performance)
- [ ] Set up desktop project structure
- [ ] Configure build scripts for all platforms
- [ ] Set up code signing certificates

#### 8.2 Platform-Specific Builds

##### Windows
- [ ] Create Windows installer (MSI/NSIS)
- [ ] Set up auto-update mechanism
- [ ] Configure Windows code signing
- [ ] Test on Windows 10/11

##### macOS
- [ ] Create macOS DMG installer
- [ ] Set up notarization process
- [ ] Configure macOS code signing
- [ ] Test on macOS 12+
- [ ] Create Apple Silicon (M1/M2) native build

##### Linux
- [ ] Create AppImage
- [ ] Create .deb package
- [ ] Create .rpm package
- [ ] Test on Ubuntu/Fedora

#### 8.3 Distribution
- [ ] Set up download page on haunt.st/desktop
- [ ] Implement download tracking/analytics
- [ ] Create installation documentation
- [ ] Set up auto-update server

#### 8.4 Desktop-Specific Features
- [ ] System tray integration
- [ ] Native notifications
- [ ] Keyboard shortcuts
- [ ] Deep linking support
- [ ] Offline mode indicator

### Decisions Needed
- [ ] **Q21:** Tauri or Electron?
- [ ] **Q22:** Auto-update strategy for desktop?
- [ ] **Q23:** System tray behavior (minimize to tray vs close)?

---

## Phase 9: Modify Position Leverage

### Overview
Add the ability to update leverage on existing positions directly from the position modification modal, providing traders with dynamic leverage control.

### Tasks

#### 9.1 Backend Leverage Update
- [ ] Add `/api/trading/positions/{id}/leverage` PUT endpoint
- [ ] Implement leverage change validation (margin requirements)
- [ ] Calculate margin delta for leverage changes
- [ ] Handle insufficient margin scenarios
- [ ] Update position record with new leverage
- [ ] Log leverage changes for audit trail

#### 9.2 Frontend Modal Enhancement
- [ ] Add leverage slider to ModifyPositionModal
- [ ] Show current leverage and proposed leverage
- [ ] Display margin impact preview
- [ ] Add real-time margin calculation
- [ ] Show warning for high leverage increases
- [ ] Add confirmation step for significant changes

#### 9.3 Position Card Integration
- [ ] Show current leverage on PositionCard
- [ ] Quick leverage adjustment controls (optional)
- [ ] Visual indicator for high leverage positions

#### 9.4 Validation & Safety
- [ ] Enforce max leverage limits per exchange
- [ ] Check maintenance margin requirements
- [ ] Prevent leverage changes during high volatility (optional)
- [ ] Add cooldown period between changes (optional)

---

## Phase 10: Portfolio Avatar Hashicons

### Overview
Generate unique, deterministic avatar icons based on portfolio/user identifiers using hashicons (identicon-style images), with WebView wrapper for native compatibility.

### Tasks

#### 10.1 Hashicon Generation
- [ ] Select hashicon library (jdenticon, minidenticons, or similar)
- [ ] Create HashiconAvatar component
- [ ] Generate SVG based on portfolio ID or public key
- [ ] Ensure deterministic output (same ID = same avatar)

#### 10.2 WebView Wrapper (for Native)
- [ ] Create WebViewHashicon component for React Native
- [ ] Render SVG in WebView for native platforms
- [ ] Implement caching to avoid re-renders
- [ ] Handle loading state
- [ ] Optimize for performance (avoid unnecessary renders)

#### 10.3 Integration
- [ ] Replace static avatars in portfolio list
- [ ] Update leaderboard player avatars
- [ ] Add to user profile display
- [ ] Update PositionCard with hashicon

#### 10.4 Customization Options
- [ ] Allow color scheme preferences (optional)
- [ ] Support custom uploaded avatars as override (optional)
- [ ] Add avatar size variants

---

## Phase 11: Username Validation & Content Moderation

### Overview
Implement a comprehensive username validation system to prevent hateful, offensive, or inappropriate usernames on the platform. This ensures the global leaderboards remain a welcoming environment for all users.

> **⚠️ IMPORTANT NOTICE:**
> This system exists solely to prevent hateful content, slurs, and harassment on public leaderboards.
> The goal is to maintain a respectful community environment, not to restrict creative or fun usernames.
> False positives should be rare and can be appealed through support.

### Tasks

#### 11.1 Offensive Content Dictionary
- [ ] Create `/src/utils/content_filter.rs` module in Haunt
- [ ] Add comprehensive word list covering:
  - [ ] Racial/ethnic slurs
  - [ ] Homophobic/transphobic terms
  - [ ] Violent threats
  - [ ] Sexual harassment terms
  - [ ] Hate group references
- [ ] Implement pattern matching for:
  - [ ] Exact matches
  - [ ] Leetspeak variations (e.g., "h8" for "hate")
  - [ ] Character substitutions (0 for o, 1 for i, etc.)
  - [ ] Spacing tricks ("ha te" for "hate")
- [ ] Add documentation header explaining purpose

#### 11.2 Validation Algorithm
- [ ] Create `UsernameValidator` struct
- [ ] Implement multi-pass validation:
  - [ ] Check for empty/too short/too long
  - [ ] Check against blocklist
  - [ ] Check for excessive special characters
  - [ ] Check for impersonation patterns (admin, mod, official)
- [ ] Return detailed rejection reason (without revealing exact trigger)
- [ ] Add severity levels (warning vs rejection)

#### 11.3 Backend Endpoint
- [ ] Create `/api/user/username` PUT endpoint
- [ ] Integrate validator into username change flow
- [ ] Return user-friendly error messages
- [ ] Log validation failures (for pattern improvement)
- [ ] Rate limit username changes (e.g., once per 24h)

#### 11.4 Frontend Integration
- [ ] Add real-time username validation in profile settings
- [ ] Show clear error messages (without revealing filter details)
- [ ] Add character counter and allowed characters guide
- [ ] Implement loading state during validation

#### 11.5 Appeals Process (Optional)
- [ ] Document appeal process for false positives
- [ ] Add admin endpoint to whitelist usernames
- [ ] Create appeal submission form

### Implementation Notes
- Blocklist should be loaded from a separate file (not hardcoded)
- Consider using a bloom filter for efficient matching
- Keep the blocklist private (not in public repo)
- Regular updates may be needed as language evolves

---

## Phase 12: Testing & Documentation

### Overview
Comprehensive testing and documentation for all new features.

### Tasks

#### 9.1 Unit Tests
- [ ] Test Preloader component states
- [ ] Test storage management functions
- [ ] Test sync status calculations
- [ ] Test exchange latency aggregation
- [ ] Test OTA update logic
- [ ] Test desktop-specific features

#### 9.2 Integration Tests
- [ ] Test preloading flow end-to-end
- [ ] Test sync across multiple servers
- [ ] Test storage cleanup process
- [ ] Test exchange data collection
- [ ] Test OTA update deployment
- [ ] Test desktop installers on all platforms

#### 9.3 Performance Testing
- [ ] Benchmark preloading time
- [ ] Test sync throughput under load
- [ ] Measure visualization performance
- [ ] Profile memory usage
- [ ] Test desktop app startup time
- [ ] Measure OTA update download/apply time

#### 9.4 Documentation
- [ ] Update API documentation
- [ ] Add architecture diagrams
- [ ] Document configuration options
- [ ] Create user guide for new features
- [ ] Write desktop installation guide
- [ ] Document OTA update process

---

## Implementation Priority

| Phase | Priority | Estimated Effort | Dependencies |
|-------|----------|------------------|--------------|
| Phase 2: Error Cleanup | HIGH | 1-2 days | None |
| Phase 1: Preloading | HIGH | 2-3 days | Phase 2 |
| Phase 3: Sync Enhancement | MEDIUM | 3-5 days | Phase 2 |
| Phase 4: Storage Management | MEDIUM | 2-3 days | Phase 3 |
| Phase 5: Exchange Metrics | MEDIUM | 2-3 days | Phase 2 |
| Phase 6: Visualization | MEDIUM | 3-5 days | Phase 3, 5 |
| Phase 7: OTA Updates | HIGH | 2-3 days | Phase 2 |
| Phase 8: Desktop App | MEDIUM | 5-7 days | Phase 2 |
| Phase 9: Testing & Docs | ONGOING | Throughout | All phases |

---

## Decisions Summary

All key decisions have been made:

| Topic | Decision |
|-------|----------|
| Preloader | Always show with 1-2s minimum |
| Storage limit | 30 GB default per server |
| Exchange dominance | Both global and per-symbol |
| Visualization | All three styles (graph, map, list) |
| Sync retention | 30 days default (configurable) |
| Cleanup | Automatic with retention policies |

---

## Notes

- All backend changes should maintain backward compatibility
- Frontend changes should support both mobile and desktop
- Consider feature flags for gradual rollout
- Monitor performance impact of new features
