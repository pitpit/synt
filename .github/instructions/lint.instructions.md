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

## Unnecessary Conditions

Do not write conditions that TypeScript can prove are always true or always false. This triggers `@typescript-eslint/no-unnecessary-condition`.

```ts
// ✅ — only guard when the type is genuinely nullable
const slot: SlotPlugTypes | undefined = arr[row]?.[col];
if (!slot) return;

// ❌ — SlotPlugTypes is [symbol,symbol,symbol,symbol], never falsy
const slot: SlotPlugTypes = arr[row][col];
if (!slot) continue; // always false — remove it
```

Also remove optional chaining (`?.`) when the left-hand side is already a non-nullable type.

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

### Preventing Unsafe Debug-State Access

- Never read debug/diagnostic objects through untyped APIs (implicit `any` or unresolved method types).
- If a class exposes debug state, define and export an explicit interface for the return shape.
- Type the producing method return value (for example: `getDebugState(): DebugState`).
- Consume debug state only through that typed contract, not via casts like `as any`.
- If a typed contract is not available yet, prefer rendering a minimal safe fallback string/value instead of unsafe property access.

```ts
// ✅ preferred: typed producer + typed consumer
export interface LibraryDebugState {
	open: boolean;
	scrollY: number;
}

getDebugState(): LibraryDebugState {
	return { open: this.isOpen, scrollY: this.scrollY };
}

// ❌ avoid: unresolved/untyped call chain used in template expressions
const state = rack.library?.getDebugState();
label.text = `${state.open} ${state.scrollY}`;
```

Project override: `@typescript-eslint/no-unused-vars` is configured as a warning (not an error), which is useful for temporary scaffolding while iterating.

## Running the Linter

```sh
npm run lint         # check
npm run lint:fix     # auto-fix
```
