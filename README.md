# Prisma Date Bug Reproduction

This repository demonstrates a bug in Prisma's PgAdapter where 2-digit years in DateTime fields are incorrectly interpreted, causing data corruption and runtime errors.

## Bug Description

When using `@prisma/adapter-pg`, historical dates with 2-digit years (e.g., years 31-99 AD) are incorrectly processed:

- **Years 31**: Throws `RangeError: Invalid time value` 
- **Years 32-49**: Incorrectly converted to 20xx (e.g., 32 → 2032, 40 → 2040)
- **Years 50-99**: Incorrectly converted to 19xx (e.g., 50 → 1950)
- **Years 100+**: Work correctly (e.g., 120 → 120)

**Important**: This bug only affects the PgAdapter connection method. Traditional Prisma connections work correctly.

## Test Setup

The test uses:
- **Prisma Client**: v6.16.0 with both PgAdapter and traditional connection
- **Database**: PostgreSQL 17 in Docker
- **Test Framework**: TypeScript with Zod validation
- **Test Cases**: Years 31, 32, 40, 50, and 120

The test runs two scenarios:
1. **PgAdapter**: Using `@prisma/adapter-pg` for connection (shows bug)
2. **Traditional**: Using standard Prisma Client connection (works correctly)

### Project Structure

```
├── index.ts              # Main test script
├── schema.prisma         # Prisma schema with TestData model
├── docker-compose.yml    # PostgreSQL + app containers
├── Dockerfile           # Node.js container setup
└── package.json         # Dependencies and scripts
```

## Running the Test

```bash
docker compose up
```

This will:
1. Start PostgreSQL container
2. Build and run the test application
3. Push the Prisma schema to the database
4. Execute the date bug reproduction tests

## Test Results

```
🔍 Prisma Date Bug Reproduction Test

=== Testing with PgAdapter ===

Testing 0031-01-01:
  ❌ CREATE 0031-01-01T00:00:00.000Z => Error: RangeError: Invalid time value
  ❌ UPDATE 0031-01-01T00:00:00.000Z => Error: RangeError: Invalid time value

Testing 0032-01-01:
  ❌ CREATE 0032-01-01T00:00:00.000Z => 2032-01-01T00:00:00.000Z (32 -> 2032)
  ❌ UPDATE 0032-01-01T00:00:00.000Z => 2032-01-01T00:00:00.000Z (32 -> 2032)

Testing 0040-01-01:
  ❌ CREATE 0040-01-01T00:00:00.000Z => 2040-01-01T00:00:00.000Z (40 -> 2040)
  ❌ UPDATE 0040-01-01T00:00:00.000Z => 2040-01-01T00:00:00.000Z (40 -> 2040)

Testing 0050-01-01:
  ❌ CREATE 0050-01-01T00:00:00.000Z => 1950-01-01T00:00:00.000Z (50 -> 1950)
  ❌ UPDATE 0050-01-01T00:00:00.000Z => 1950-01-01T00:00:00.000Z (50 -> 1950)

Testing 0120-01-01:
  ✅ CREATE 0120-01-01T00:00:00.000Z => 0120-01-01T00:00:00.000Z (120 -> 120)
  ✅ UPDATE 0120-01-01T00:00:00.000Z => 0120-01-01T00:00:00.000Z (120 -> 120)

=== Testing with Traditional Connection ===

Testing 0031-01-01:
  ✅ CREATE 0031-01-01T00:00:00.000Z => 0031-01-01T00:00:00.000Z (31 -> 31)
  ✅ UPDATE 0031-01-01T00:00:00.000Z => 0031-01-01T00:00:00.000Z (31 -> 31)

Testing 0032-01-01:
  ✅ CREATE 0032-01-01T00:00:00.000Z => 0032-01-01T00:00:00.000Z (32 -> 32)
  ✅ UPDATE 0032-01-01T00:00:00.000Z => 0032-01-01T00:00:00.000Z (32 -> 32)

Testing 0040-01-01:
  ✅ CREATE 0040-01-01T00:00:00.000Z => 0040-01-01T00:00:00.000Z (40 -> 40)
  ✅ UPDATE 0040-01-01T00:00:00.000Z => 0040-01-01T00:00:00.000Z (40 -> 40)

Testing 0050-01-01:
  ✅ CREATE 0050-01-01T00:00:00.000Z => 0050-01-01T00:00:00.000Z (50 -> 50)
  ✅ UPDATE 0050-01-01T00:00:00.000Z => 0050-01-01T00:00:00.000Z (50 -> 50)

Testing 0120-01-01:
  ✅ CREATE 0120-01-01T00:00:00.000Z => 0120-01-01T00:00:00.000Z (120 -> 120)
  ✅ UPDATE 0120-01-01T00:00:00.000Z => 0120-01-01T00:00:00.000Z (120 -> 120)
```

## Technical Details

### Test Implementation

The test creates JavaScript Date objects with 4-digit years and validates them with Zod before passing to Prisma:

```typescript
const testDates = [
  new Date('0031-01-01T00:00:00.000Z'),
  new Date('0032-01-01T00:00:00.000Z'), 
  new Date('0040-01-01T00:00:00.000Z'),
  new Date('0050-01-01T00:00:00.000Z'),
  new Date('0120-01-01T00:00:00.000Z')
]
```

Each test performs both CREATE and UPDATE operations, then compares the original year with the retrieved year to detect corruption.

### Database Schema

```prisma
model TestData {
  id   String    @id @default(uuid())
  date DateTime?
}
```

## Impact

This bug affects applications using PgAdapter that deal with:
- Historical data (ancient dates, genealogy, archaeology)
- Legacy system migrations
- Any domain requiring accurate historical date representation

The silent data corruption (years 32-99) is particularly dangerous as it may go unnoticed until data integrity issues surface.

## Workaround

Use the traditional Prisma connection method instead of PgAdapter for applications requiring historical date accuracy.

## Environment

- **Prisma**: 6.16.0
- **Node.js**: 24
- **PostgreSQL**: 17
- **Adapter**: @prisma/adapter-pg
