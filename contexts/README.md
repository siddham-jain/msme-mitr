# Context Providers

This directory contains React Context providers for managing global application state.

## AuthContext

The `AuthContext` provides authentication state and methods throughout the application.

### Features

- **User Authentication State**: Manages current user and profile data
- **Sign Up**: Create new user accounts with email/password
- **Sign In**: Authenticate existing users
- **Sign Out**: Log out current user
- **Profile Management**: Update user profile information
- **Auto Session Management**: Automatically handles session refresh and state changes
- **Profile Loading**: Automatically loads user profile from database on authentication

### Usage

```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, profile, loading, signIn, signOut, updateProfile } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome, {profile?.full_name || user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### API

#### State

- `user: User | null` - Current authenticated user from Supabase Auth
- `profile: UserProfile | null` - User profile data from database
- `loading: boolean` - Loading state during initialization

#### Methods

- `signUp(email, password, fullName?)` - Create a new user account
- `signIn(email, password)` - Sign in with email and password
- `signOut()` - Sign out the current user
- `updateProfile(updates)` - Update the current user's profile

### Implementation Details

1. **Session Initialization**: On mount, fetches the current session and loads the user profile
2. **Auth State Listener**: Subscribes to auth state changes and updates user/profile accordingly
3. **Automatic Profile Loading**: When a user signs in, their profile is automatically loaded from the database
4. **Last Login Tracking**: Updates the `last_login_at` timestamp on successful sign in
5. **Profile Refresh**: After updating a profile, automatically reloads the latest data

### Type Safety

The context is fully typed using TypeScript with types from:
- `@supabase/supabase-js` for User and Session types
- `@/types/database` for UserProfile and UserProfileUpdate types

### Error Handling

All authentication methods throw errors that should be caught by the calling component:

```typescript
try {
  await signIn(email, password)
} catch (error) {
  console.error('Sign in failed:', error)
  // Show error to user
}
```

### Provider Setup

The `AuthProvider` is already wrapped around the application in `app/layout.tsx`:

```typescript
<AuthProvider>
  {children}
</AuthProvider>
```

This ensures the authentication context is available throughout the entire application.


## ThemeContext

The `ThemeContext` provides theme management (light/dark mode) throughout the application.

### Features

- **Theme State Management**: Manages current theme (light or dark)
- **localStorage Persistence**: Saves theme preference to localStorage
- **System Preference Detection**: Automatically detects system theme preference on initial load
- **Dynamic Theme Switching**: Updates theme in real-time without page reload
- **SSR Safe**: Prevents flash of unstyled content during server-side rendering

### Usage

```typescript
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  )
}
```

### API

#### State

- `theme: 'light' | 'dark'` - Current active theme

#### Methods

- `setTheme(theme)` - Set the theme to 'light' or 'dark'

### Implementation Details

1. **Initial Load**: On mount, checks localStorage for saved theme preference
2. **System Preference Fallback**: If no saved preference, uses system preference via `prefers-color-scheme`
3. **localStorage Persistence**: Saves theme changes to localStorage for persistence across sessions
4. **CSS Class Management**: Toggles 'dark' class on document root for Tailwind dark mode
5. **Error Handling**: Gracefully handles localStorage errors (e.g., in private browsing mode)
6. **Hydration Safety**: Prevents rendering until mounted to avoid SSR/client mismatch

### Provider Setup

Wrap your application with `ThemeProvider` in `app/layout.tsx`:

```typescript
<ThemeProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

### Dark Mode Configuration

The theme system works with Tailwind's dark mode. Ensure your `tailwind.config.ts` has:

```typescript
export default {
  darkMode: 'class', // Uses class-based dark mode
  // ... rest of config
}
```

### Storage Key

Theme preference is stored in localStorage with the key: `'theme'`
