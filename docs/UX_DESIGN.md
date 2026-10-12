# MCDM Commerce Optimizer — UX/UI Design Guidelines

**Status**: Active  
**Last Updated**: 5 May 2026  
**Purpose**: Simplify navigation, reduce cognitive load, and create a demo-ready experience

---

## Current Problems

### 1. Information Overload
- **Issue**: Sidebar has 20+ navigation items across 6 sections
- **Impact**: Users don't know where to start
- **Solution**: Progressive disclosure, contextual navigation, guided workflows

### 2. Unclear User Journey
- **Issue**: No clear path from "I want to rank products" to "I have ranked results"
- **Impact**: Users get lost in features
- **Solution**: Primary action flows, step indicators, breadcrumbs

### 3. Feature Discoverability
- **Issue**: Advanced features (sensitivity analysis, weight governance) buried in navigation
- **Impact**: Users miss powerful capabilities
- **Solution**: Contextual prompts, "Next steps" suggestions, feature highlights

---

## Design Principles

### 1. Progressive Disclosure
Show only what's needed at each step. Hide complexity until requested.

### 2. Task-Oriented Navigation
Organize by "what users want to do" not "what features exist"

### 3. Guided Workflows
Provide clear paths for common tasks with step indicators

### 4. Contextual Help
Show help where users need it, not in a separate section

### 5. Visual Hierarchy
Use size, color, and spacing to guide attention to primary actions

---

## Navigation Redesign

### Current Structure (Too Complex)
```
Overview (2 items)
Decision Engine (3 items)
Product Definition (3 items)
Governance (4 items)
Data Ingestion (3 items)
Experimentation (1 item)
```

### Proposed Structure (Simplified)

#### **Primary Navigation** (Always Visible)
```
🏠 Home
🎯 Quick Start (New!)
📊 Rankings
🧪 Experiments
⚙️ Settings
```

#### **Quick Start Menu** (Guided Workflows)
```
1. Rank Products (First Time)
   → Define Criteria → Connect Data → Run TOPSIS → View Results

2. Create Experiment
   → Choose Variants → Set Traffic → Launch → Monitor

3. Optimize Weights
   → Review Current → Run Sensitivity → Propose Changes → Get Approval
```

#### **Settings Menu** (Advanced Features)
```
Data & Connectors
├─ Shopify Connection
├─ GA4 Integration
└─ Signal Mapping

Governance
├─ Weight Approvals
├─ Audit Log
└─ Transparency

Configuration
├─ Criteria Library
├─ TOPSIS Policies
└─ KPI Framework

Advanced
├─ Competitor Matrix
├─ Positioning
└─ API Documentation
```

---

## Home Dashboard Redesign

### Current: Generic Overview
Shows everything, prioritizes nothing

### Proposed: Action-Oriented Home

#### **Hero Section** (Top)
```
┌─────────────────────────────────────────────────────┐
│  Welcome back, [Name]                               │
│  Last ranking: 2 hours ago • 247 products analyzed  │
│                                                     │
│  [🎯 Rank Products Now]  [🧪 View Experiments]     │
└─────────────────────────────────────────────────────┘
```

#### **Quick Actions** (Cards)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🎯 New       │  │ 🔄 Re-run    │  │ 📊 View      │
│ Ranking      │  │ Last         │  │ History      │
│              │  │ Analysis     │  │              │
│ [Start →]    │  │ [Run →]      │  │ [Browse →]   │
└──────────────┘  └──────────────┘  └──────────────┘
```

#### **Status Cards** (At-a-Glance)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Data Fresh   │  │ Experiments  │  │ Pending      │
│ ✓ All synced │  │ 2 running    │  │ 1 approval   │
│ 15 min ago   │  │ 1 completed  │  │ needed       │
└──────────────┘  └──────────────┘  └──────────────┘
```

#### **Recent Activity** (Timeline)
```
• Experiment "Homepage Ranking" completed - 12% uplift
• Weight change approved by @reviewer
• 247 products synced from Shopify
```

---

## Ranking Workflow (Simplified)

### Current: 4 Separate Pages
1. `/dashboard/criteria` - Define criteria
2. `/dashboard/topsis` - Configure policy
3. `/dashboard/topsis/run` - Input data
4. Results shown inline

### Proposed: Single Guided Flow

#### **Step 1: Choose Criteria** (Modal or Wizard)
```
┌─────────────────────────────────────────────────────┐
│ Step 1 of 3: Select Criteria                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ☑ Conversion Rate (Benefit)                        │
│ ☑ Revenue Per Visitor (Benefit)                    │
│ ☑ Customer Rating (Benefit)                        │
│ ☐ Return Rate (Cost)                               │
│ ☐ Inventory Level (Benefit)                        │
│                                                     │
│ [+ Add Custom Criterion]                           │
│                                                     │
│ [Cancel]                        [Next: Data →]     │
└─────────────────────────────────────────────────────┘
```

#### **Step 2: Connect Data**
```
┌─────────────────────────────────────────────────────┐
│ Step 2 of 3: Data Source                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ○ Use Shopify Data (Recommended)                   │
│   ✓ Connected • 247 products • Synced 15 min ago   │
│                                                     │
│ ○ Upload CSV File                                  │
│   [Choose File...]                                 │
│                                                     │
│ ○ Manual Entry                                     │
│   Enter product scores manually                    │
│                                                     │
│ [← Back]                        [Next: Review →]   │
└─────────────────────────────────────────────────────┘
```

#### **Step 3: Review & Run**
```
┌─────────────────────────────────────────────────────┐
│ Step 3 of 3: Review & Run                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Criteria: 3 selected                               │
│ Products: 247 from Shopify                         │
│ Policy: Vector normalization (default)             │
│                                                     │
│ [⚙️ Advanced Settings]                             │
│                                                     │
│ [← Back]                    [🎯 Run Analysis →]    │
└─────────────────────────────────────────────────────┘
```

#### **Results Page** (Clean)
```
┌─────────────────────────────────────────────────────┐
│ Ranking Results                                     │
│ 247 products ranked • Completed 2 seconds ago       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ #1  Product A    Score: 0.892  [View Details]      │
│ #2  Product B    Score: 0.847  [View Details]      │
│ #3  Product C    Score: 0.823  [View Details]      │
│ ...                                                 │
│                                                     │
│ [💾 Export CSV]  [🧪 Create Experiment]  [🔄 Re-run]│
└─────────────────────────────────────────────────────┘
```

---

## Role-Based Simplification

### Merchandiser View
**Focus**: Quick actions, product rankings, experiment results  
**Hide**: Technical details, governance workflows, API docs

### Analyst View
**Focus**: Deep analysis, sensitivity tools, data quality  
**Show**: All technical features, full TOPSIS breakdown

### Executive View
**Focus**: KPIs, trends, ROI metrics  
**Hide**: Implementation details, technical configuration

### Admin View
**Focus**: System health, user management, connectors  
**Show**: All features for troubleshooting

---

## Visual Improvements

### 1. Color Coding
- **Primary Actions**: Cyan (current brand color)
- **Success States**: Green
- **Warnings**: Yellow/Amber
- **Errors**: Red
- **Neutral**: Gray

### 2. Button Hierarchy
- **Primary**: Large, filled, cyan
- **Secondary**: Medium, outlined, white
- **Tertiary**: Small, ghost, gray

### 3. Spacing
- Increase whitespace between sections
- Use cards to group related content
- Add breathing room around CTAs

### 4. Typography
- **Headings**: Bold, larger size
- **Body**: Regular weight, comfortable line height
- **Labels**: Uppercase, smaller, gray

---

## Demo-Ready Checklist

### Before Demo
- [ ] Set up sample data (products, criteria, rankings)
- [ ] Create 1-2 completed experiments with results
- [ ] Ensure all data sources show "synced" status
- [ ] Clear any error states or warnings
- [ ] Test the guided ranking workflow end-to-end

### Demo Script
1. **Start**: Home dashboard - show status cards
2. **Quick Start**: Click "Rank Products" → guided flow
3. **Results**: Show ranked products with scores
4. **AI**: Click "Explain" on a ranking
5. **Experiment**: Create A/B test from ranking
6. **Governance**: Show weight approval workflow
7. **Export**: Download results as CSV

### Demo Data Setup
```sql
-- 10-15 sample products with realistic scores
-- 2-3 criteria (Conversion Rate, Revenue, Rating)
-- 1 completed experiment showing 10-15% uplift
-- Recent activity in audit log
```

---

## Implementation Priority

### Phase 1: Critical (Demo Blockers)
1. Simplified home dashboard with quick actions
2. Guided ranking workflow (3-step wizard)
3. Hide advanced features in Settings menu
4. Clean up sidebar navigation

### Phase 2: Important (Demo Enhancers)
5. Role-based view filtering
6. Contextual "Next steps" prompts
7. Visual polish (spacing, colors, hierarchy)
8. Sample data generator for demos

### Phase 3: Nice-to-Have (Post-Demo)
9. Interactive product tour
10. Context-sensitive help tooltips
11. Keyboard shortcut hints
12. Animated transitions

---

## Success Metrics

### User Testing
- Time to first ranking: < 5 minutes
- Task completion rate: > 90%
- User satisfaction: > 4/5 stars

### Demo Feedback
- "I understand what this does": > 95%
- "I know where to start": > 90%
- "This looks professional": > 85%

---

## Next Steps

1. Review this document with team
2. Prioritize Phase 1 items
3. Create Figma mockups (optional)
4. Implement simplified navigation
5. Build guided ranking workflow
6. Test with 2-3 users
7. Iterate based on feedback
