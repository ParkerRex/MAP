# Turbo Repo Todo List

- [x] Create package.json for each package/app
- [ ] Emails
  - [ ] Swap out the actual templates
    - [ ] Waitlist
    - [ ] Onboarding
- [ ] Set up tsconfig files for each package/app
- [ ] Implement separate actions for each dashboard event
- [ ] Create separate queries for Supabase functions
- [ ] Find and replace all UI components
- [ ] Set up Resend for email functionality
- [ ] Implement email loops
- [ ] Configure Upstash setup
- [ ] Add back my custom scripts for resetting the db 
- [ ] Set up Job for google calendar fetch and ongoing every few minutes


## Omitting, but might come back to

- [ ] Add documents package that processes medicals and other documents



## Deployment Todos 
- [ ] The actual hooks in GitHub
- [ ] Linking environment variables in a smart way 
- [ ] Events
  - [ ] Adding instrumentation for the calendar and the server actions!

### Getting Around
#### For db
1. make your sql changes in a new migration
2. test them locally
3. gen types --local 
4. push your migration to prod `supabase db push --linked`


### How AI Assistant Works
1. Assistant Component (`dashboard/src/components/assistant/index.tsx`):
This is the main component that handles the chat interface. It manages the AI state and UI state, and renders the chat messages.
2. AI Action (`dashboard/src/actions/ai/chat/tools/burn-rate.tsx`):
This file defines the getBurnRateTool function, which is responsible for fetching burn rate data and preparing it for display.
3. UI Component (`dashboard/src/actions/ai/chat/tools/ui/burn-rate-ui.tsx`):
This component renders the burn rate information in a user-friendly format.
4. Queries (`packages/supabase/src/queries/index.ts` and `cached-queries.ts`):
These files contain the database queries to fetch burn rate data.
5. Utils (`dashboard/src/actions/ai/chat/utils.tsx`):
This file contains utility functions, including getUIComponentFromMessage which maps tool results to their corresponding UI components.

``` mermaid
    graph TD
        A[Assistant Component<br>assistant/index.tsx] --> B[AI Action<br>chat/tools/burn-rate.tsx]
        B --> C[Supabase Queries<br>queries/index.ts<br>queries/cached-queries.ts]
        C --> B
        B --> D[BurnRateUI Component<br>chat/tools/ui/burn-rate-ui.tsx]
        D --> E[Utils<br>chat/utils.tsx]
        E --> A
        A --> F[Chat Component<br>components/chat/index.tsx]
        F --> A
```

#### Log
- [x] Merge pull request #208 from midday-ai/feature/inbox-ocr-provider


