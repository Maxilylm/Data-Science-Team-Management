# App Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce code duplication, eliminate redundant network requests, and improve UX quality across the Agent Team Dashboard.

**Architecture:** Extract shared CSS to a stylesheet (replacing ~200 lines of duplicated inline hover handlers), derive ticket summary/unassigned data client-side from the main tickets query, and add a global error toast for failed mutations.

**Tech Stack:** React, TypeScript, CSS modules, react-query

---

### Task 1: Create shared CSS stylesheet with hover utilities

**Files:**
- Create: `packages/client/src/styles/components.css`
- Modify: `packages/client/src/main.tsx`

Add CSS classes for the 3 hover patterns used everywhere:
- `.btn-hover` — scale(1.02) + box-shadow on hover
- `.card-hover` — translateY(-1px) + elevated shadow on hover
- `.icon-btn-hover` — background highlight on hover

### Task 2: Refactor TicketCard to use CSS classes

**Files:**
- Modify: `packages/client/src/components/TicketCard/TicketCard.tsx`

Remove all `onMouseEnter`/`onMouseLeave` handlers (~60 lines), replace with CSS class names.

### Task 3: Refactor AgentCard to use CSS classes

**Files:**
- Modify: `packages/client/src/components/AgentPanel/AgentCard.tsx`

Remove hover handlers (~30 lines), replace with CSS classes.

### Task 4: Refactor TicketBoard to use CSS classes

**Files:**
- Modify: `packages/client/src/components/TicketBoard/TicketBoard.tsx`

Remove hover handlers (~80 lines), replace with CSS classes. This is the worst offender.

### Task 5: Derive unassigned/summary client-side in useTickets

**Files:**
- Modify: `packages/client/src/hooks/useTickets.ts`

Remove the 2 extra `useQuery` calls for `/tickets/unassigned` and `/tickets/summary`. Compute both from the main `tickets` array using `useMemo`.

### Task 6: Add error toast for failed mutations

**Files:**
- Modify: `packages/client/src/hooks/useTickets.ts`
- Modify: `packages/client/src/hooks/useAgents.ts`

Add `onError` callbacks to mutations that surface errors via the existing Toast component.

### Task 7: Add ARIA attributes to key interactive elements

**Files:**
- Modify: `packages/client/src/components/TicketBoard/TicketBoard.tsx`
- Modify: `packages/client/src/components/AgentPanel/AgentPanel.tsx`

Add `role`, `aria-label`, and `aria-live` to dynamic regions.

### Task 8: Commit and verify

Run tests, commit all changes.
