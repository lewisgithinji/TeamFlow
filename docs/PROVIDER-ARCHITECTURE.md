# Provider Architecture - Best Practices Guide

## ✅ **FIXED: All Provider Errors Resolved**

This guide explains how to avoid React Context provider errors when making updates to the codebase.

---

## 🏗️ **Current Provider Structure**

```tsx
RootLayout (app/layout.tsx)
  └─ Providers (components/providers/Providers.tsx)
      └─ QueryClientProvider (React Query)
          └─ ClientWebSocketProvider
              └─ WebSocketProvider
                  └─ NotificationListener (listens for real-time events)
                  └─ Your app components (children)
```

---

## 🎯 **The Golden Rules**

### **Rule 1: Never Use Context Hooks Outside Their Provider**

❌ **WRONG:**
```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  useNotifications(); // ❌ Error! WebSocketProvider is not available here
  return <div>{children}</div>;
}
```

✅ **CORRECT:**
```tsx
// components/providers/Providers.tsx
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <NotificationListener /> {/* ✅ Inside WebSocketProvider */}
        {children}
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
```

### **Rule 2: Provider Order Matters**

Providers must be ordered from most general to most specific:

```tsx
✅ CORRECT ORDER:
QueryClientProvider (needed by everything)
  └─ WebSocketProvider (needs QueryClient)
      └─ ThemeProvider (optional)
          └─ AuthProvider (optional)
              └─ Your app

❌ WRONG ORDER:
WebSocketProvider
  └─ QueryClientProvider
      // WebSocket hooks won't work because they need QueryClient first!
```

### **Rule 3: Use Wrapper Components for Context Hooks**

Instead of calling hooks directly in layouts, create wrapper components:

```tsx
// ✅ Good: Separate component
export function NotificationListener() {
  useNotifications(); // Inside the right provider
  return null;
}

// ✅ Use it inside the provider
<WebSocketProvider>
  <NotificationListener />
  {children}
</WebSocketProvider>
```

---

## 📋 **Hook-to-Provider Requirements**

| Hook | Requires | Example |
|------|----------|---------|
| `useQuery()` | `QueryClientProvider` | `useQuery({ queryKey: ['tasks'] })` |
| `useMutation()` | `QueryClientProvider` | `useMutation({ mutationFn: createTask })` |
| `useQueryClient()` | `QueryClientProvider` | `const queryClient = useQueryClient()` |
| `useWebSocket()` | `WebSocketProvider` | `const { socket } = useWebSocket()` |
| `useWebSocketEvent()` | `WebSocketProvider` | `useWebSocketEvent('task:created', handler)` |
| `useNotifications()` | Both Query + WebSocket | Uses both contexts internally |
| `useTaskEvents()` | Both Query + WebSocket | Listens to task WebSocket events |

---

## 🛠️ **How to Add New Features Without Errors**

### **Step 1: Identify Dependencies**

Before adding a hook, check what it needs:

```tsx
// hooks.ts
export function useMyNewHook() {
  const queryClient = useQueryClient(); // ❌ Needs QueryClientProvider!
  const { socket } = useWebSocket();     // ❌ Needs WebSocketProvider!
  // ...
}
```

### **Step 2: Check Provider Structure**

Look at `Providers.tsx` to ensure required providers exist:

```tsx
// components/providers/Providers.tsx
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}> {/* ✅ Available */}
      <ClientWebSocketProvider>               {/* ✅ Available */}
        {children}
      </ClientWebSocketProvider>
    </QueryClientProvider>
  );
}
```

### **Step 3: Create a Listener Component (if needed)**

If your hook needs to run globally (like notifications):

```tsx
// components/[feature]/[Feature]Listener.tsx
'use client';

import { useMyNewHook } from '@/lib/hooks';

export function MyFeatureListener() {
  useMyNewHook(); // Sets up listeners
  return null;     // No UI needed
}
```

### **Step 4: Add to Providers**

```tsx
// components/providers/Providers.tsx
import { MyFeatureListener } from '@/components/feature/MyFeatureListener';

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <NotificationListener />
        <MyFeatureListener /> {/* ✅ Add here */}
        {children}
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
```

---

## 🚨 **Common Errors and Solutions**

### **Error 1: "No QueryClient set, use QueryClientProvider"**

**Cause:** Using React Query hooks without `QueryClientProvider`

**Solution:**
```tsx
// components/providers/Providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### **Error 2: "useWebSocket must be used within WebSocketProvider"**

**Cause:** Using WebSocket hooks outside `WebSocketProvider`

**Solution:**
```tsx
// ❌ WRONG - Direct use in layout
export default function Layout({ children }) {
  useWebSocketEvent('task:created', handler); // Error!
  return <div>{children}</div>;
}

// ✅ CORRECT - Use listener component
export function Providers({ children }) {
  return (
    <WebSocketProvider>
      <TaskEventListener /> {/* Component uses the hook */}
      {children}
    </WebSocketProvider>
  );
}
```

### **Error 3: "Cannot read properties of undefined"**

**Cause:** Accessing context value before provider mounts

**Solution:**
```tsx
// Add client-side check
'use client';

export function MyComponent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Now safe to use context hooks
  const value = useMyContext();
}
```

---

## 📝 **Checklist Before Making Updates**

Before adding new hooks or features:

- [ ] **Check dependencies:** What providers does this hook need?
- [ ] **Verify provider order:** Is the provider hierarchy correct?
- [ ] **Create listener component:** If hook runs globally, wrap in component
- [ ] **Add to Providers.tsx:** Place listener inside correct provider
- [ ] **Test immediately:** Refresh browser and check for errors
- [ ] **Check console:** Look for context-related warnings

---

## 🎓 **Real-World Examples**

### **Example 1: Adding Task Notifications**

```tsx
// ❌ WRONG
// app/(dashboard)/[workspaceId]/tasks/page.tsx
export default function TasksPage() {
  useTaskNotifications(); // Error: Outside provider!
  return <div>Tasks</div>;
}

// ✅ CORRECT
// components/tasks/TaskNotificationListener.tsx
'use client';

export function TaskNotificationListener() {
  useTaskNotifications();
  return null;
}

// components/providers/Providers.tsx
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TaskNotificationListener /> {/* ✅ Inside provider */}
        {children}
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
```

### **Example 2: Adding Theme Switching**

```tsx
// components/providers/Providers.tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system">
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Now anywhere in your app:
export function ThemeToggle() {
  const { theme, setTheme } = useTheme(); // ✅ Works!
  return <button onClick={() => setTheme('dark')}>Toggle</button>;
}
```

---

## 🔍 **Debugging Provider Issues**

### **Step 1: Check Browser Console**

Look for errors like:
- `No QueryClient set`
- `useWebSocket must be used within`
- `Cannot read properties of undefined`

### **Step 2: Verify Component Tree**

Use React DevTools to see provider hierarchy:
```
<QueryClientProvider>
  <WebSocketProvider>
    <YourComponent> ← Is this where you're calling the hook?
```

### **Step 3: Add Debug Logging**

```tsx
export function Providers({ children }) {
  console.log('🏗️ Providers mounting...');

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        {console.log('✅ WebSocketProvider ready')}
        {children}
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
```

---

## 📚 **Reference: Current Implementation**

### **File Locations**

```
apps/web/src/
├── app/
│   ├── layout.tsx                          # Root layout with Providers
│   └── (dashboard)/
│       └── layout.tsx                      # Dashboard layout (NO hooks here)
├── components/
│   ├── providers/
│   │   └── Providers.tsx                   # Main provider setup ⭐
│   └── notifications/
│       └── NotificationListener.tsx        # Global notification listener ⭐
└── lib/
    └── websocket/
        ├── WebSocketContext.tsx            # WebSocket provider
        ├── ClientWebSocketProvider.tsx     # Client-side wrapper
        └── hooks.ts                        # WebSocket hooks
```

### **Key Files to Remember**

1. **Providers.tsx** - Add all global listeners here
2. **[Feature]Listener.tsx** - Create these for global hooks
3. **layout.tsx** - Keep layouts clean, no hooks

---

## ✅ **Summary**

**Do:**
- ✅ Create listener components for global hooks
- ✅ Place listeners inside correct providers
- ✅ Order providers correctly (Query → WebSocket → Theme)
- ✅ Test immediately after changes

**Don't:**
- ❌ Call context hooks in layouts
- ❌ Use hooks outside their providers
- ❌ Assume provider order doesn't matter
- ❌ Skip testing after provider changes

---

**Last Updated:** 2025-10-14
**Status:** ✅ All provider errors resolved
**Current Implementation:** Working correctly

---

## 🆘 **Quick Fix Template**

If you encounter a provider error:

```tsx
// 1. Create listener component
// components/[feature]/[Feature]Listener.tsx
'use client';

export function MyFeatureListener() {
  useMyHook(); // Your hook here
  return null;
}

// 2. Add to Providers
// components/providers/Providers.tsx
import { MyFeatureListener } from '@/components/feature/MyFeatureListener';

export function Providers({ children }) {
  return (
    <RequiredProvider>
      <MyFeatureListener /> {/* Add here */}
      {children}
    </RequiredProvider>
  );
}

// 3. Done! ✅
```

---

Need help? Check the examples above or refer to the current working implementation in `Providers.tsx`.
