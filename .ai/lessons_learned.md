# Prevention Rules (READ BEFORE EVERY PHASE)

## Java / Spring Boot
1. ALWAYS annotate @Transactional on service methods that write to DB
2. NEVER return entity objects directly — use DTOs via MapStruct
3. ALWAYS use @Valid on @RequestBody parameters
4. NEVER forget @Column(name="...") when Java field name != SQL column name
5. ALWAYS handle Optional.empty() — never call .get() without .isPresent()
6. Use @JsonIgnore on password/hash fields in entities
7. @Autowired is deprecated — use constructor injection
8. NEVER catch Exception generically — catch specific exceptions
9. Virtual threads: don't use synchronized blocks (use ReentrantLock)
10. Spring Security: filter order MATTERS — JWT filter before UsernamePasswordFilter

## React / TypeScript
1. ALWAYS clean up WebSocket subscriptions in useEffect return
2. Memoize Context values with useMemo to prevent cascade re-renders
3. NEVER mutate state directly — always create new objects/arrays
4. Handle 401 responses globally in Axios interceptor (redirect to login)
5. Use ErrorBoundary around every page component
6. Tailwind CSS 4: @import "tailwindcss" (not @tailwind directives)

## PostgreSQL
1. ALWAYS add indexes for foreign keys and WHERE clause columns
2. JSONB operations: use -> for JSON, ->> for text extraction
3. UUIDs: use gen_random_uuid() (built into PG, no extension needed)
4. Timestamps: always store as TIMESTAMPTZ (with timezone)

## ML / Python
1. StandardScaler MUST be fitted on training data only, applied to test/inference
2. Save scaler WITH model (Pipeline or separate .joblib)
3. Handle NaN/null values BEFORE feature extraction
4. LSTM input shape: (batch_size, sequence_length, n_features)
5. PyTorch: always call model.eval() before inference

## Security
1. NEVER log tokens, API keys, passwords, or PII
2. ALWAYS validate Razorpay webhook signatures BEFORE processing
3. NEVER trust client-side plan/role information
4. ALWAYS use parameterized queries (JPA handles this)
5. Refresh tokens: invalidate old token when issuing new one
