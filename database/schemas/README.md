# Database schemas

TypeScript schema definitions live in `types/database.ts`.

After running migrations, regenerate types:

```bash
npm run db:types
```

Merge generated output into `types/database.ts` or use `types/database.generated.ts` alongside hand-maintained helpers.
