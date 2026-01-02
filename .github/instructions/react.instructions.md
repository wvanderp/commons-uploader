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

---

This is a desktop first application. so make sure to use the realestate available on larger screens wisely. make the UI dense. use grids and flexbox to create layouts that adapt to larger screens.


