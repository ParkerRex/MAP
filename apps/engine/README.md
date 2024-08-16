# map Engine API

## Overview

The map Engine API is a comprehensive backend service designed to integrate various data providers in the domains of finance, calendar, and health. It's built using TypeScript and runs on Cloudflare Workers, providing a scalable and efficient solution for data aggregation and standardization.

## Project Structure

The project is organized into several key directories:

- `src/`: Contains the main application code
- `tasks/`: Houses scripts for data synchronization and maintenance
- `providers/`: Implements integrations with various third-party services
- `routes/`: Defines API endpoints
- `utils/`: Contains utility functions used throughout the application

## How It Works

### Providers

Providers are the core of our integration system. Each provider (e.g., Google Calendar, Plaid, Apple Health) has its own directory within the `providers/` folder. A typical provider structure includes:

- `*-api.ts`: Handles direct communication with the third-party API
- `*-provider.ts`: Implements the provider interface and business logic
- `transform.ts`: Converts provider-specific data to our standardized format
- `types.ts`: Defines TypeScript types specific to the provider

### Interfaces

The `interface.ts` file in the `providers/` directory defines common interfaces that all providers must implement. This ensures consistency across different integrations and allows for easy addition of new providers.

### Types

TypeScript types are extensively used throughout the project to ensure type safety. Common types are defined in `providers/types.ts`, while provider-specific types are in their respective `types.ts` files.

### Zod

Zod is used for runtime type checking and schema validation. It's particularly useful in our route handlers to validate incoming requests and outgoing responses. Zod schemas are defined in `routes/*/schema.ts` files.

### Factories

Factory patterns are employed to instantiate the correct provider based on user input or configuration. The main factory is in `providers/index.ts`, with sub-factories for each provider category (financial, calendar, health).

### Tasks

Tasks, located in the `tasks/` directory, are scripts that handle data synchronization, imports, and other maintenance operations. Key tasks include:

- `sync-calendar.ts`: Syncs user's calendar data across providers
- `sync-health.ts`: Syncs user's health data across providers
- `import.ts`: Imports institution data for financial providers

### Routes

API routes are defined in the `routes/` directory, organized by domain (financial, calendar, health). Each route uses Zod for request/response validation and interacts with the appropriate providers through the factory system.

## Key Components

### Provider Factory

The provider factory (`providers/index.ts`) is responsible for creating instances of the correct provider based on the given type and configuration. It uses a switch statement to determine which specific provider to instantiate.

### Data Transformation

Each provider has a `transform.ts` file that converts the provider's specific data format into our standardized format. This ensures consistency across different providers and simplifies data handling in the rest of the application.

### Middleware

Middleware functions (`src/middleware.ts`) handle cross-cutting concerns such as authentication, logging, and error handling. They are applied to routes as needed.

### Utilities

Utility functions in the `utils/` directory provide common functionality used across the application, such as error handling, date manipulation, and health metric standardization.

## Adding a New Provider

To add a new provider:

1. Create a new directory in the appropriate category under `providers/`
2. Implement the required files: `*-api.ts`, `*-provider.ts`, `transform.ts`, and `types.ts`
3. Update the relevant factory in `providers/index.ts`
4. Add any necessary environment variables to `.env-example` and `wrangler.toml`
5. Implement or update routes as needed in the `routes/` directory

## Running the Project

1. Clone the repository
2. Copy `.env-example` to `.env` and fill in the required values
3. Install dependencies with `npm install`
4. Run the development server with `npm run dev`

## Deployment

The project is deployed to Cloudflare Workers. Use `npm run deploy` to deploy to production.

## Testing

(Note: Add information about testing strategy and how to run tests once implemented)

## Contributing

(Add contribution guidelines as needed)

This README provides a high-level overview of the map Engine API codebase. For more detailed information on specific components or processes, refer to the inline documentation within the code files.

## Structure

project-root/
├── apps/
│   └── engine/
│       ├── src/
│       │   ├── common/
│       │   │   ├── bindings.ts         # Updated Bindings type with new provider env variables
│       │   │   └── schema.ts           # Updated common Zod schemas for all provider types
│       │   ├── providers/
│       │   │   ├── financial/          # Existing financial providers
│       │   │   │   ├── gocardless/     # Existing GoCardless implementation
│       │   │   │   ├── plaid/          # Existing Plaid implementation
│       │   │   │   ├── teller/         # Existing Teller implementation
│       │   │   │   └── index.ts        # Financial provider factory
│       │   │   ├── calendar/
│       │   │   │   ├── google/
│       │   │   │   │   ├── google-api.ts           # Google Calendar API client
│       │   │   │   │   ├── google-provider.ts      # Google Calendar provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Google Calendar data to standard format
│       │   │   │   │   └── types.ts                # Google Calendar specific types
│       │   │   │   ├── apple/
│       │   │   │   │   ├── apple-api.ts            # Apple Calendar API client
│       │   │   │   │   ├── apple-provider.ts       # Apple Calendar provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Apple Calendar data to standard format
│       │   │   │   │   └── types.ts                # Apple Calendar specific types
│       │   │   │   ├── outlook/
│       │   │   │   │   ├── outlook-api.ts          # Outlook Calendar API client
│       │   │   │   │   ├── outlook-provider.ts     # Outlook Calendar provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Outlook Calendar data to standard format
│       │   │   │   │   └── types.ts                # Outlook Calendar specific types
│       │   │   │   ├── index.ts                    # Calendar provider factory
│       │   │   │   └── types.ts                    # Common calendar types and interfaces
│       │   │   ├── health/
│       │   │   │   ├── apple-health/
│       │   │   │   │   ├── apple-health-api.ts     # Apple Health API client
│       │   │   │   │   ├── apple-health-provider.ts # Apple Health provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Apple Health data to standard format
│       │   │   │   │   └── types.ts                # Apple Health specific types
│       │   │   │   ├── whoop/
│       │   │   │   │   ├── whoop-api.ts            # Whoop API client
│       │   │   │   │   ├── whoop-provider.ts       # Whoop provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Whoop data to standard format
│       │   │   │   │   └── types.ts                # Whoop specific types
│       │   │   │   ├── oura/
│       │   │   │   │   ├── oura-api.ts             # Oura API client
│       │   │   │   │   ├── oura-provider.ts        # Oura provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Oura data to standard format
│       │   │   │   │   └── types.ts                # Oura specific types
│       │   │   │   ├── strava/
│       │   │   │   │   ├── strava-api.ts           # Strava API client
│       │   │   │   │   ├── strava-provider.ts      # Strava provider implementation
│       │   │   │   │   ├── transform.ts            # Transform Strava data to standard format
│       │   │   │   │   └── types.ts                # Strava specific types
│       │   │   │   ├── index.ts                    # Health provider factory
│       │   │   │   └── types.ts                    # Common health types and interfaces
│       │   │   ├── index.ts                        # Main provider factory for all types
│       │   │   ├── interface.ts                    # Updated provider interfaces for all types
│       │   │   └── types.ts                        # Updated common types for all providers
│       │   ├── routes/
│       │   │   ├── financial/                      # Renamed from root level
│       │   │   │   ├── accounts/                   # Existing financial accounts routes
│       │   │   │   ├── institutions/               # Existing financial institutions routes
│       │   │   │   └── transactions/               # Existing financial transactions routes
│       │   │   ├── calendar/
│       │   │   │   ├── index.ts                    # Calendar routes (events, calendars)
│       │   │   │   └── schema.ts                   # Calendar route schemas
│       │   │   ├── health/
│       │   │   │   ├── index.ts                    # Health routes (activities, sleep, etc.)
│       │   │   │   └── schema.ts                   # Health route schemas
│       │   │   ├── auth/
│       │   │   │   ├── index.ts                    # Updated auth routes for all provider types
│       │   │   │   └── schema.ts                   # Updated auth schemas for all provider types
│       │   │   └── health-check/                   # Renamed from 'health' to avoid confusion
│       │   │       ├── index.ts                    # API health check route
│       │   │       └── schema.ts                   # Health check schema
│       │   ├── utils/
│       │   │   ├── account.ts                      # Existing account utility
│       │   │   ├── countries.ts                    # Existing countries utility
│       │   │   ├── error.ts                        # Existing error handling utility
│       │   │   ├── logger.ts                       # Existing logging utility
│       │   │   ├── logo.ts                         # Existing logo utility
│       │   │   ├── paginate.ts                     # Existing pagination utility
│       │   │   ├── retry.ts                        # Existing retry utility
│       │   │   ├── search.ts                       # Existing search utility
│       │   │   ├── date.ts                         # New date utility for calendar operations
│       │   │   └── health-metrics.ts               # New utility for standardizing health metrics
│       │   ├── index.ts                            # Updated main application entry point
│       │   └── middleware.ts                       # Updated middleware for new routes if necessary
│       ├── tasks/
│       │   ├── download-teller.ts                  # Existing Teller download task
│       │   ├── get-institutions.ts                 # Updated to include new provider types
│       │   ├── import.ts                           # Updated import script for all provider types
│       │   ├── sync-calendar.ts                    # New task for initial calendar sync
│       │   ├── sync-health.ts                      # New task for initial health data sync
│       │   ├── utils.ts                            # Updated utility functions for tasks
│       │   └── queue.ts                            # New queue management for sync tasks
│       ├── .dev.vars-example                       # Updated with new provider env variables
│       ├── .env-example                            # Updated with new provider env variables
│       ├── package.json                            # Updated with new dependencies
│       ├── tsconfig.json                           # Existing TypeScript configuration
│       └── wrangler.toml                           # Updated with new bindings if necessary
