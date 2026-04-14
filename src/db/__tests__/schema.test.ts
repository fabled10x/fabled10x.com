import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '@/db/schema';
import type { User, NewUser, Purchase, NewPurchase } from '@/db/schema';

describe('db schema structure (unit)', () => {
  it('unit_schema_tables_exported: users, sessions, verificationTokens, purchases are named exports', () => {
    expect(schema).toHaveProperty('users');
    expect(schema).toHaveProperty('sessions');
    expect(schema).toHaveProperty('verificationTokens');
    expect(schema).toHaveProperty('purchases');
  });

  it('unit_schema_types_exported: User/NewUser/Purchase/NewPurchase type imports resolve (compile-time)', () => {
    const u: User = {
      id: 'u-1',
      email: 'a@example.com',
      emailVerified: null,
      name: null,
      image: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      lastSignInAt: null,
    };
    const nu: NewUser = { email: 'new@example.com' };
    const p: Purchase = {
      id: 'p-1',
      userId: 'u-1',
      productSlug: 'workflow-templates',
      stripeSessionId: 'cs_test_123',
      stripePaymentIntentId: 'pi_test_123',
      amountCents: 1999,
      currency: 'usd',
      purchasedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const np: NewPurchase = {
      userId: 'u-1',
      productSlug: 'workflow-templates',
      stripeSessionId: 'cs_test_456',
      stripePaymentIntentId: 'pi_test_456',
      amountCents: 2999,
    };
    expect(u.email).toBe('a@example.com');
    expect(nu.email).toBe('new@example.com');
    expect(p.amountCents).toBe(1999);
    expect(np.userId).toBe('u-1');
  });

  it('unit_schema_users_email_unique_config: users.email column is NOT NULL + UNIQUE', () => {
    const cfg = getTableConfig(schema.users);
    const email = cfg.columns.find((c) => c.name === 'email');
    expect(email).toBeDefined();
    expect(email?.notNull).toBe(true);
    expect(email?.isUnique).toBe(true);
  });

  it('unit_schema_sessions_user_id_cascade: sessions.user_id FK has onDelete=cascade', () => {
    const cfg = getTableConfig(schema.sessions);
    expect(cfg.foreignKeys.length).toBeGreaterThan(0);
    const fk = cfg.foreignKeys[0];
    const ref = fk.reference();
    expect(ref.foreignColumns[0].name).toBe('id');
    expect(fk.onDelete).toBe('cascade');
  });

  it('unit_schema_verification_tokens_composite_pk: primary key spans (identifier, token)', () => {
    const cfg = getTableConfig(schema.verificationTokens);
    expect(cfg.primaryKeys.length).toBeGreaterThanOrEqual(1);
    const pk = cfg.primaryKeys[0];
    const columnNames = pk.columns.map((c) => c.name).sort();
    expect(columnNames).toEqual(['identifier', 'token']);
  });

  it('unit_schema_purchases_stripe_session_id_unique: purchases.stripe_session_id is NOT NULL + UNIQUE', () => {
    const cfg = getTableConfig(schema.purchases);
    const col = cfg.columns.find((c) => c.name === 'stripe_session_id');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(true);
    expect(col?.isUnique).toBe(true);
  });

  it('unit_schema_purchases_user_id_index: purchases has explicit index on user_id', () => {
    const cfg = getTableConfig(schema.purchases);
    expect(cfg.indexes.length).toBeGreaterThan(0);
    const idx = cfg.indexes[0];
    const config = idx.config;
    expect(config.name).toContain('user_id');
    const idxColNames = config.columns.map((c: { name: string }) => c.name);
    expect(idxColNames).toContain('user_id');
  });
});

// --- Integration tests (gated: only run when DATABASE_URL is available) ---

const hasDb =
  typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0;

describe.skipIf(!hasDb)('db schema (integration)', () => {
  let db: typeof import('@/db/client').db;

  const truncateAll = async () => {
    await db.delete(schema.purchases);
    await db.delete(schema.sessions);
    await db.delete(schema.verificationTokens);
    await db.delete(schema.users);
  };

  beforeAll(async () => {
    const mod = await import('@/db/client');
    db = mod.db;
  });

  beforeEach(truncateAll);
  afterAll(truncateAll);

  it('integration_insert_user_select_by_id: insert user, select by id returns same email', async () => {
    const [inserted] = await db
      .insert(schema.users)
      .values({ email: 'alice@example.com' })
      .returning();
    expect(inserted.id).toBeTruthy();
    expect(inserted.email).toBe('alice@example.com');

    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, inserted.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('alice@example.com');
  });

  it('integration_insert_duplicate_email_throws: second insert with same email rejects with UNIQUE violation', async () => {
    await db.insert(schema.users).values({ email: 'dup@example.com' });
    await expect(
      db.insert(schema.users).values({ email: 'dup@example.com' }),
    ).rejects.toThrow();
  });

  it('integration_insert_purchase_select_by_user_id: purchase referencing a user is selectable by userId', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'buyer@example.com' })
      .returning();
    await db.insert(schema.purchases).values({
      userId: user.id,
      productSlug: 'workflow-templates',
      stripeSessionId: 'cs_test_abc',
      stripePaymentIntentId: 'pi_test_abc',
      amountCents: 4900,
    });
    const rows = await db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].productSlug).toBe('workflow-templates');
    expect(rows[0].amountCents).toBe(4900);
  });

  it('integration_insert_duplicate_stripe_session_id_throws: UNIQUE(stripe_session_id) enforced', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'webhook@example.com' })
      .returning();
    await db.insert(schema.purchases).values({
      userId: user.id,
      productSlug: 'workflow-templates',
      stripeSessionId: 'cs_dup_1',
      stripePaymentIntentId: 'pi_dup_1',
      amountCents: 1999,
    });
    await expect(
      db.insert(schema.purchases).values({
        userId: user.id,
        productSlug: 'workflow-templates',
        stripeSessionId: 'cs_dup_1',
        stripePaymentIntentId: 'pi_dup_2',
        amountCents: 1999,
      }),
    ).rejects.toThrow();
  });

  it('integration_delete_user_cascades_sessions_purchases: deleting user removes dependent rows', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'cascade@example.com' })
      .returning();
    await db.insert(schema.sessions).values({
      sessionToken: 'tok_cascade_1',
      userId: user.id,
      expires: new Date('2027-01-01T00:00:00Z'),
    });
    await db.insert(schema.purchases).values({
      userId: user.id,
      productSlug: 'workflow-templates',
      stripeSessionId: 'cs_cascade_1',
      stripePaymentIntentId: 'pi_cascade_1',
      amountCents: 1999,
    });

    await db.delete(schema.users).where(eq(schema.users.id, user.id));

    const sessions = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));
    const purchases = await db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.userId, user.id));
    expect(sessions).toHaveLength(0);
    expect(purchases).toHaveLength(0);
  });

  it('integration_gen_random_uuid_produces_distinct_ids: 5 inserts produce 5 unique uuids (pgcrypto smoke)', async () => {
    const rows = await db
      .insert(schema.users)
      .values([
        { email: 'u1@example.com' },
        { email: 'u2@example.com' },
        { email: 'u3@example.com' },
        { email: 'u4@example.com' },
        { email: 'u5@example.com' },
      ])
      .returning();
    const ids = rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(5);
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  it('sec_tampering_sql_injection_email_field: SQL meta-chars stored verbatim, no schema tampering', async () => {
    const vectors = [
      "a'; DROP TABLE users; --",
      "admin@example.com' OR '1'='1",
      "<script>alert('xss')</script>@example.com",
    ];
    for (const vector of vectors) {
      await db.insert(schema.users).values({ email: vector });
    }
    const all = await db.select().from(schema.users);
    expect(all).toHaveLength(vectors.length);
    for (const vector of vectors) {
      const match = all.find((row) => row.email === vector);
      expect(match).toBeDefined();
    }
  });

  it('edge_state_verification_token_composite_pk_allows_different_pairs: same identifier + diff token ok; exact dup rejects', async () => {
    await db.insert(schema.verificationTokens).values({
      identifier: 'alice@example.com',
      token: 'tok_1',
      expires: new Date('2027-01-01T00:00:00Z'),
    });
    await db.insert(schema.verificationTokens).values({
      identifier: 'alice@example.com',
      token: 'tok_2',
      expires: new Date('2027-01-01T00:00:00Z'),
    });
    const rows = await db.select().from(schema.verificationTokens);
    expect(rows).toHaveLength(2);

    await expect(
      db.insert(schema.verificationTokens).values({
        identifier: 'alice@example.com',
        token: 'tok_1',
        expires: new Date('2027-02-01T00:00:00Z'),
      }),
    ).rejects.toThrow();
  });

  it('edge_state_purchase_with_missing_user_fk_throws: inserting purchase with unknown userId throws FK violation', async () => {
    await expect(
      db.insert(schema.purchases).values({
        userId: '00000000-0000-0000-0000-000000000000',
        productSlug: 'workflow-templates',
        stripeSessionId: 'cs_orphan_1',
        stripePaymentIntentId: 'pi_orphan_1',
        amountCents: 1999,
      }),
    ).rejects.toThrow();
  });

  it('edge_input_purchase_currency_defaults_to_usd: NewPurchase without currency defaults to "usd"', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'default-currency@example.com' })
      .returning();
    const [purchase] = await db
      .insert(schema.purchases)
      .values({
        userId: user.id,
        productSlug: 'workflow-templates',
        stripeSessionId: 'cs_default_curr_1',
        stripePaymentIntentId: 'pi_default_curr_1',
        amountCents: 1999,
      })
      .returning();
    expect(purchase.currency).toBe('usd');
  });

  it('edge_input_user_created_at_defaults_to_now: NewUser without createdAt stores near server now()', async () => {
    const before = Date.now();
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'now-default@example.com' })
      .returning();
    const after = Date.now();
    const createdAtMs = user.createdAt.getTime();
    // allow +/- 5 seconds for server clock drift
    expect(createdAtMs).toBeGreaterThanOrEqual(before - 5000);
    expect(createdAtMs).toBeLessThanOrEqual(after + 5000);
  });

  it('edge_state_user_last_sign_in_at_nullable: NewUser without lastSignInAt stores NULL', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'nullable@example.com' })
      .returning();
    expect(user.lastSignInAt).toBeNull();
  });

  it('data_cascade_user_delete_removes_sessions: user delete empties sessions for that user', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'data-sess@example.com' })
      .returning();
    await db.insert(schema.sessions).values({
      sessionToken: 'tok_data_sess',
      userId: user.id,
      expires: new Date('2027-01-01T00:00:00Z'),
    });
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    const rows = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));
    expect(rows).toHaveLength(0);
  });

  it('data_cascade_user_delete_removes_purchases: user delete empties purchases for that user', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'data-purch@example.com' })
      .returning();
    await db.insert(schema.purchases).values({
      userId: user.id,
      productSlug: 'workflow-templates',
      stripeSessionId: 'cs_data_1',
      stripePaymentIntentId: 'pi_data_1',
      amountCents: 1999,
    });
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    const rows = await db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.userId, user.id));
    expect(rows).toHaveLength(0);
  });

  it('data_precision_amount_cents_is_integer: amount_cents stored as integer, round-trips exactly', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'precision@example.com' })
      .returning();
    const inputs = [0, 1, 99, 1999, 4900, 999999];
    for (const amt of inputs) {
      const [p] = await db
        .insert(schema.purchases)
        .values({
          userId: user.id,
          productSlug: 'workflow-templates',
          stripeSessionId: `cs_prec_${amt}`,
          stripePaymentIntentId: `pi_prec_${amt}`,
          amountCents: amt,
        })
        .returning();
      expect(p.amountCents).toBe(amt);
      expect(Number.isInteger(p.amountCents)).toBe(true);
    }
  });

  it('data_consistency_uuid_defaults_produce_distinct: 10 inserts produce 10 unique ids', async () => {
    const batch = Array.from({ length: 10 }).map((_, i) => ({
      email: `uniq-${i}@example.com`,
    }));
    const rows = await db.insert(schema.users).values(batch).returning();
    const ids = rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('data_returning_clause_matches_insert_shape: .returning() returns row matching $inferSelect shape', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'shape@example.com' })
      .returning();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('lastSignInAt');
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});
