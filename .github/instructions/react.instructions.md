---
applyTo: '**/*.ts, **/*.tsx'
---

Use named function over arrow functions

```tsx
// bad
const MyComponent = () => {
  return <div>Hello World</div>;
};

// good
function MyComponent() {
  return <div>Hello World</div>;
}
```
