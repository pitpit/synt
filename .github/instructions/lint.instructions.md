---
description: "Use when writing or editing TypeScript or JavaScript code. Enforces ESLint rules: prefer-const, no-var, eqeqeq, object-shorthand, prefer-template, prefer-arrow-callback, no-console, strict TypeScript type-checking."
applyTo: ["src/**/*.ts", "tests/**/*.ts", "**/*.js"]
---
# Lint Rules

This project uses ESLint with `@typescript-eslint/flat/strict-type-checked`. Generated code must pass `npm run lint`.

## Variable Declarations

- Never use `var`. Always use `const` or `let`.
- Prefer `const` for all bindings that are not reassigned.

```ts
// ✅
const x = 1;
let count = 0;

// ❌
var x = 1;
let name = 'Alice'; // never reassigned
```

## Equality

Use `===` / `!==` for all comparisons (except `== null` checks, which are allowed).

```ts
// ✅
if (value === 0) { ... }
if (value == null) { ... }  // null/undefined guard — allowed

// ❌
if (value == 0) { ... }
```

## Object Shorthand

Use shorthand property and method syntax in object literals.

```ts
// ✅
const obj = { name, getValue() { return 1; } };

// ❌
const obj = { name: name, getValue: function() { return 1; } };
```

## Template Literals

Use template literals instead of string concatenation.

```ts
// ✅
const msg = `Hello, ${name}!`;

// ❌
const msg = 'Hello, ' + name + '!';
```

## Arrow Callbacks

Use arrow functions for callbacks passed to higher-order functions.

```ts
// ✅
items.forEach((item) => process(item));

// ❌
items.forEach(function(item) { process(item); });
```

## Console

`console.*` calls trigger a **warning**. Remove debug logging before committing; use a proper logger or test assertions instead.

## TypeScript Strictness (`strict-type-checked`)

- No implicit `any` — all parameters and return types must be typed or inferable.
- No unsafe member access, unsafe calls, or unsafe assignments.
- No floating promises — always `await` or explicitly `.catch()` async calls.
- No unused variables (warn).

## Running the Linter

```sh
npm run lint         # check
npm run lint:fix     # auto-fix
```
