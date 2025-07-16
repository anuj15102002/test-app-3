# MySQL Migration Fix - Column Length Issue

## Problem
When migrating from SQLite to MySQL, you encountered this error:
```
Error: Failed to save configuration: Invalid `prisma.popupConfig.upsert()` invocation: The provided value for the column is too long for the column's type. Column: segments
```

## Root Cause
- **SQLite**: `String` type can store unlimited text
- **MySQL**: `String` defaults to `VARCHAR(191)` which is too short for JSON data
- The `segments` field stores JSON data for wheel segments, which can be quite long

## Solution Applied
Updated the Prisma schema to use `@db.Text` for fields that store JSON or long text:

```prisma
model PopupConfig {
  // ... other fields
  segments        String? @db.Text  // Changed from String?
  // ... other fields
}

model PopupAnalytics {
  // ... other fields
  metadata     String? @db.Text     // Changed from String?
  // ... other fields
}
```

## Next Steps

### 1. Generate New Migration
```bash
# Generate Prisma client with new schema
npx prisma generate

# Create migration for the schema changes
npx prisma migrate dev --name fix_text_columns
```

### 2. If Migration Fails, Reset Database
```bash
# Reset migrations (development only - will lose data)
npx prisma migrate reset

# Create fresh migration
npx prisma migrate dev --name init
```

### 3. For Production Migration
```bash
# Deploy migrations to production
npx prisma migrate deploy
```

## MySQL Column Types Reference

| Prisma Type | MySQL Default | With @db.Text | Max Length |
|-------------|---------------|---------------|------------|
| `String` | `VARCHAR(191)` | `TEXT` | 65,535 chars |
| `String @db.Text` | `TEXT` | `TEXT` | 65,535 chars |
| `String @db.LongText` | `LONGTEXT` | `LONGTEXT` | 4GB |

## Fields That Need @db.Text

In your schema, these fields store JSON or long text:
- ✅ `PopupConfig.segments` - Stores wheel segment JSON
- ✅ `PopupAnalytics.metadata` - Stores event metadata JSON
- Consider: `PopupConfig.description` - If descriptions can be long

## Testing the Fix

After running the migration, test with a complex wheel configuration:
```javascript
const segments = [
  { label: '5% OFF', color: '#ff6b6b', value: '5' },
  { label: '10% OFF', color: '#4ecdc4', value: '10' },
  { label: '15% OFF', color: '#45b7d1', value: '15' },
  { label: '20% OFF', color: '#96ceb4', value: '20' },
  { label: 'FREE SHIPPING', color: '#feca57', value: 'shipping' },
  { label: 'TRY AGAIN', color: '#1e3c72', value: null }
];
```

This should now save without the column length error.

## Prevention

When migrating between databases:
1. Always check column type mappings
2. Use appropriate Prisma field attributes
3. Test with realistic data sizes
4. Consider using `@db.LongText` for very large JSON fields

The fix ensures your popup configurations can store complex wheel segments and analytics metadata without length restrictions.