# FINAL AUTH ARCHITECTURE (RECOMMENDED)

## AUTHENTICATION METHODS
- Email/Password Login
- Google OAuth2 Login

## AUTHORIZATION
- JWT Access Token
- Refresh Token Rotation
- Role-based authorization

## BACKEND STACK
- Spring Security
- Spring OAuth2 Client
- JJWT
- PostgreSQL
- Redis (optional for blacklist/cache/rate limit)

--------------------------------------------------

# FINAL AUTH FLOW

## 1. EMAIL/PASSWORD LOGIN FLOW

Frontend
→ POST /auth/login
→ Spring Security authenticate
→ backend generates:
- access token (short-lived JWT)
- refresh token
  → save refresh token in DB
  → return tokens to frontend

--------------------------------------------------

## 2. GOOGLE OAUTH2 LOGIN FLOW

Frontend
→ "Continue with Google"

→ Spring Security OAuth2 Login
→ redirect to Google
→ Google authenticates user
→ callback to backend

Backend:
- verify Google identity
- extract email/profile/googleId
- create user if not exists
- generate INTERNAL JWT tokens:
    - access token
    - refresh token

IMPORTANT:
Do NOT use Google access token as application token.

The system must issue its own internal JWTs.

--------------------------------------------------

# TOKEN STRATEGY

## ACCESS TOKEN
- JWT
- short-lived (15–30 minutes)
- stateless
- contains:
    - userId
    - role
    - provider
    - tokenVersion

## REFRESH TOKEN
- long-lived
- stored hashed in database
- rotation enabled
- revocable
- device/session-aware

--------------------------------------------------

# SECURITY REQUIREMENTS

Must implement:
- refresh token rotation
- token revocation
- logout invalidation
- password hashing (BCrypt/Argon2)
- rate limiting
- secure cookie support
- OAuth2 state validation
- CSRF considerations
- XSS-safe token strategy

--------------------------------------------------

# JWT REQUIREMENTS

Use:
- JJWT library
- centralized JwtService

Avoid:
- scattered JWT parsing logic
- manual token parsing everywhere

JWT handling must be centralized through:
- JwtService
- JwtAuthenticationFilter
- Spring Security context

--------------------------------------------------

# WHY THIS ARCHITECTURE

This architecture:
- is production-ready
- supports Google Sign-In
- remains simple enough for MVP
- avoids premature IAM complexity
- is future-scalable
- demonstrates strong backend/security understanding

--------------------------------------------------

# FUTURE EVOLUTION PATH

Future upgrades MAY include:
- Nimbus migration
- Keycloak/Auth0 integration
- OAuth2 Authorization Server
- enterprise SSO
- multi-provider login
- MFA
- organization/workspace support

Current architecture must be designed
to support future migration without
major business logic rewrites.

--------------------------------------------------

# IMPORTANT ARCHITECTURE PRINCIPLE

External providers (Google OAuth2)
are ONLY for identity verification.

The application must maintain:
- its own internal users
- its own JWT lifecycle
- its own authorization system
- its own RBAC model

This keeps the system:
- provider-independent
- scalable
- maintainable
- enterprise-ready later

--------------------------------------------------

# IMPLEMENTATION REQUIREMENTS

Generate:
- Spring Security configuration
- OAuth2 login flow
- JWT generation flow
- refresh token rotation flow
- database schema
- security filters
- authentication handlers
- logout flow
- token refresh endpoints
- Google OAuth2 integration
- production-ready package structure

Explain:
- security tradeoffs
- why internal JWT is necessary
- refresh token rotation reasoning
- OAuth2 flow reasoning
- future migration path