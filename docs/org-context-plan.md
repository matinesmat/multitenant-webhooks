## Organization context via combo box (Zustand + URL param) — Plan of Action

### Goals
- Replace the dashboard Organizations page with a global combo box selector in the user menu.
- Use Zustand for client-side organization context.
- Eliminate explicit `organizationId` props/inputs in forms and server actions; infer org from URL path `/:organizationId/...`.
- Show an interim organization selection step immediately after login (first time or when not set), then navigate to `/:organizationId/dashboard`.

### Architecture Overview
- Source of truth: Organization context comes from the URL path param `/:organizationId`.
- Client context: Zustand stores the currently resolved organization info (id, name, slug) for quick access and UI; it mirrors the URL but is not the authority.
- UI entry points:
  - User menu combo box (primary switcher) that pushes a new route with the selected org id.
  - One-time interim selection page (on login when no selection exists) with list/combo of orgs that redirects to `/:organizationId/dashboard` upon selection.
- Server resolution: Pages, layouts, and route handlers read org from route params; server actions parse org from the current request path (via headers) or are colocated under a dynamic segment so params are derivable.

### Implementation Steps
1) State management (Zustand)
   - Create `stores/organizationStore.ts` with:
     - `selectedOrganization` (nullable)
     - `setSelectedOrganization(org)` which updates Zustand only.
   - Hydration: derive client state from the current `organizationId` route param on mount; watch route changes to update store.

2) URL contract
   - Path pattern: `/:organizationId/...` across the app (e.g., `/:organizationId/dashboard`, `/:organizationId/dashboard/students`).
   - `organizationId` may be an id or slug; we will standardize on whichever is already in the DB and enforce uniqueness.
   - Old routes (without org) will redirect to an org-scoped route if resolvable or to the selection page.

3) Org switcher UI
   - Create `components/OrgSwitcher.tsx`:
     - Fetch user organizations (Supabase) client-side or via a lightweight server function.
     - Render a searchable combo box with the current selection.
     - On change → update Zustand and navigate using `router.push` to the same subpath under the new `/:organizationId` (preserve pathname after org segment).
   - Integrate into the user menu/top bar (likely in `components/DashboardShell.tsx` or related header component).

4) Interim selection page after login
   - Add `app/select-organization/page.tsx`:
     - List/combobox of organizations for the current user.
     - On submit → navigate to `/:organizationId/dashboard`.
   - In the root auth landing (e.g., `app/page.tsx` or post-login redirect logic):
     - If user has 1 org → redirect to `/:organizationId/dashboard`.
     - If user has ≥2 orgs and current URL is not org-scoped → redirect to `/select-organization`.
     - If user has 0 orgs → redirect to org creation flow.

5) Remove explicit organizationId props/inputs
   - Update forms in `app/[organizationId]/dashboard/students/**` and `app/[organizationId]/dashboard/webhooks/**` to stop passing `organizationId`.
   - Update server actions to resolve `organizationId` from the current request path:
     - Prefer colocating actions within `app/[organizationId]/.../actions.ts` and providing a small helper (e.g., `getOrganizationIdFromPath(headers)`) to parse the org id from `headers().get('referer')` if needed.
   - Update API route handlers under `app/api/[organizationId]/**` to use `params.organizationId`.

6) Validation and security
   - In all writes/reads, verify that the authenticated user is a member of `params.organizationId`; otherwise return 403.
   - When parsing from path (server actions), always re-validate membership with Supabase to prevent URL tampering.

7) Backwards compatibility and cleanup
   - Keep existing Organizations CRUD under `/:organizationId/dashboard/organizations` (or move accordingly) for management, but remove it as the primary context setter.
   - Add redirects from legacy paths (e.g., `/dashboard/...`) to an org-scoped route if a default org can be inferred; otherwise send users to `/select-organization`.
   - Migrate any components relying on `organizationId` prop to instead consume the Zustand store (client) or derive from the URL.

8) Edge cases
   - User has no organizations → guide to create one; after creation, navigate to the new org path.
   - User is removed from the selected organization → detect on next server call; redirect to `/select-organization`.
   - Multiple tabs: Zustand persists per tab; URL is the source-of-truth so refreshes maintain context.

9) Testing
   - Manual flows: login → interim select → dashboard usage → switch org via menu (URL changes) → forms submit without org id.
   - Unit tests for server actions resolving org id from request path and membership validation.
   - Smoke test API endpoints under `app/api/[organizationId]/**` with valid/invalid membership.

### File/Code Touchpoints (anticipated)
- New: `stores/organizationStore.ts`
- New: `components/OrgSwitcher.tsx`
- New: `app/select-organization/page.tsx`
- New: Dynamic segment: `app/[organizationId]/dashboard/**` (move dashboard routes under here)
- New: Dynamic API segment: `app/api/[organizationId]/**` (move API routes under here)
- New: Helper: `lib/getOrganizationIdFromPath.ts` to parse org id from `headers()` for server actions
- Edit: `components/DashboardShell.tsx` (insert switcher)
- Edit: `app/[organizationId]/dashboard/layout.tsx` (auth + membership guard)
- Edit: Actions and pages moved from `app/dashboard/**` to `app/[organizationId]/dashboard/**`
- Edit: API moved from `app/api/**` to `app/api/[organizationId]/**`

### Rollout Sequence
1. Introduce dynamic segment routing and redirects from legacy paths.
2. Ship Zustand store (URL-driven) and Org Switcher that navigates between org-scoped routes.
3. Implement interim selection page + login redirect rules.
4. Migrate dashboard pages/actions under `app/[organizationId]/dashboard/**`.
5. Migrate API to `app/api/[organizationId]/**` and update callers.
6. Remove org id from forms and client calls; validate membership everywhere.
7. Final QA and cleanup.


