# Copilot Instructions

## TypeScript Style Preferences

### Assignment Minimization

- Reduce the number of assignment operations whenever possible.
- Try to avoid temporary variables when they only hold a value that is immediately assigned elsewhere.
- Prefer direct assignment to the destination field/property when readability is preserved.

Preferred:

    this.circle = new Konva.Circle({ ... });

Avoid:

    const circle = new Konva.Circle({ ... });
    this.circle = circle;

