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
