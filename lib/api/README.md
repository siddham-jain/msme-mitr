# API Route Protection Utilities

This module provides utilities for protecting API routes with authentication and role-based access control (RBAC) using Supabase Auth in Next.js App Router.

## Features

- ✅ Authentication verification for API routes
- ✅ Role-based access control (RBAC)
- ✅ Standardized error responses
- ✅ Type-safe with TypeScript
- ✅ Easy-to-use helper functions
- ✅ Comprehensive error handling

## Installation

The utilities are already included in the project. Import them from `@/lib/api/auth`:

```typescript
import { requireAuth, requireRole, badRequest, success } from '@/lib/api/auth'
```

## Core Functions

### `requireAuth(request: NextRequest)`

Verifies that the request has a valid authentication token.

**Returns:**
- `AuthResult` with `user` and `supabase` client if authenticated
- `NextResponse` with 401 error if not authenticated

**Example:**
```typescript
import { NextRequest } from 'next/server'
import { requireAuth, success } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Return 401 error
  }
  
  const { user, supabase } = authResult
  
  // Continue with authenticated request
  return success({ message: `Hello ${user.email}` })
}
```

### `requireRole(request: NextRequest, allowedRoles: string[])`

Verifies authentication and checks if the user has one of the allowed roles.

**Returns:**
- `RoleAuthResult` with `user`, `profile`, and `supabase` if authorized
- `NextResponse` with 401/403 error if not authorized

**Example:**
```typescript
import { NextRequest } from 'next/server'
import { requireRole, success } from '@/lib/api/auth'

export async function DELETE(request: NextRequest) {
  const authResult = await requireRole(request, ['admin', 'super_admin'])
  
  if (authResult instanceof NextResponse) {
    return authResult // Return 401 or 403 error
  }
  
  const { user, profile, supabase } = authResult
  
  // Continue with authorized request
  return success({ message: 'Admin action completed' })
}
```

## Error Response Helpers

### Standard Error Responses

```typescript
import {
  badRequest,        // 400 Bad Request
  unauthorized,      // 401 Unauthorized
  forbidden,         // 403 Forbidden
  notFound,          // 404 Not Found
  conflict,          // 409 Conflict
  unprocessableEntity, // 422 Unprocessable Entity
  internalError,     // 500 Internal Server Error
} from '@/lib/api/auth'

// Usage examples
if (!body.email) {
  return badRequest('Email is required')
}

if (!token) {
  return unauthorized('Authentication token required')
}

if (user.role !== 'admin') {
  return forbidden('Admin access required')
}

if (!resource) {
  return notFound('Resource not found')
}

if (existingUser) {
  return conflict('User already exists')
}

if (validationErrors.length > 0) {
  return unprocessableEntity('Invalid input data')
}

try {
  // ... operation
} catch (err) {
  return internalError('Failed to process request')
}
```

### Custom Error Response

```typescript
import { createErrorResponse } from '@/lib/api/auth'

return createErrorResponse(
  'custom_error',
  'Custom error message',
  418, // Custom status code
  'ERR001' // Optional error code
)
```

## Success Response Helpers

```typescript
import { success, created, noContent } from '@/lib/api/auth'

// 200 OK with data
return success({ id: '123', name: 'Test' })

// 201 Created
return created({ id: newId, ...data })

// 204 No Content
return noContent()
```

## Complete API Route Examples

### Protected GET Route

```typescript
// app/api/profile/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, success, internalError } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    
    return success(profile)
  } catch (error) {
    return internalError('Failed to fetch profile')
  }
}
```

### Protected POST Route with Validation

```typescript
// app/api/conversations/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, badRequest, created, internalError } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  try {
    const body = await request.json()
    
    if (!body.title) {
      return badRequest('Title is required')
    }
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: body.title,
        session_id: `session_${Date.now()}`,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return created(conversation)
  } catch (error) {
    return internalError('Failed to create conversation')
  }
}
```

### Admin-Only DELETE Route

```typescript
// app/api/admin/users/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireRole, notFound, noContent, internalError } from '@/lib/api/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireRole(request, ['admin', 'super_admin'])
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { supabase } = authResult
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('User not found')
      }
      throw error
    }
    
    return noContent()
  } catch (error) {
    return internalError('Failed to delete user')
  }
}
```

### Route with Multiple Role Checks

```typescript
// app/api/schemes/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, requireRole, success, created, forbidden } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  // All authenticated users can view schemes
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { supabase } = authResult
  
  const { data: schemes } = await supabase
    .from('schemes')
    .select('*')
    .eq('is_active', true)
  
  return success(schemes)
}

export async function POST(request: NextRequest) {
  // Only admins can create schemes
  const authResult = await requireRole(request, ['admin', 'super_admin'])
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { supabase } = authResult
  const body = await request.json()
  
  const { data: scheme } = await supabase
    .from('schemes')
    .insert(body)
    .select()
    .single()
  
  return created(scheme)
}
```

## Error Response Format

All error responses follow this structure:

```typescript
{
  error: string,      // Error identifier (e.g., 'not_authenticated')
  message: string,    // Human-readable error message
  code?: string       // Optional error code for debugging
}
```

## Type Definitions

```typescript
interface AuthResult {
  user: User
  supabase: SupabaseClient<Database>
}

interface RoleAuthResult extends AuthResult {
  profile: UserProfile
}

interface ErrorResponse {
  error: string
  message: string
  code?: string
}
```

## Best Practices

1. **Always check authentication first**: Use `requireAuth` or `requireRole` at the start of your route handler
2. **Handle the response**: Check if the result is a `NextResponse` (error) before proceeding
3. **Use appropriate error helpers**: Choose the right HTTP status code for your error
4. **Provide clear error messages**: Help clients understand what went wrong
5. **Log errors**: Use `console.error` for debugging (already included in the utilities)
6. **Validate input**: Check request body and parameters before processing
7. **Use try-catch**: Wrap database operations in try-catch blocks
8. **Return consistent responses**: Use the success helpers for consistent response format

## Security Considerations

- ✅ Uses Supabase Auth for secure token verification
- ✅ Validates user identity on every request
- ✅ Enforces Row Level Security (RLS) through Supabase client
- ✅ Never exposes service role key to client
- ✅ Logs authentication errors for monitoring
- ✅ Returns generic error messages to prevent information leakage

## Requirements Covered

This implementation satisfies the following requirements from the Supabase Integration spec:

- **10.1**: API routes verify authentication tokens
- **10.2**: Users can only access their own data
- **10.3**: Unauthorized access attempts are denied
- **10.4**: Unauthenticated requests return 401
- **10.5**: Unauthorized requests return 403
- **10.6**: Admin endpoints verify role
- **10.7**: Role verification failures are rejected

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Row Level Security](../../../supabase/RLS_DOCUMENTATION.md)
