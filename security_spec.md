# Security Specification - PaieQuébec Firestore RBAC

## 1. Data Invariants
- **Catch-All Default Deny**: All undefined document collections and subcollections deny read and write by default.
- **Identity & Authentication**: No unauthenticated client can read or write any document in `/users` or `/admins`.
- **RBAC Role Gate**:
  - Only authenticated users whose UID matches `{userId}` can read their own profile in `/users/{userId}`. Admins can read all profiles.
  - A user cannot self-promote to `role: 'admin'` or modify their assigned `role` or `uid`.
  - The `/admins/{adminId}` collection is strictly read-only for verified administrators and cannot be modified by standard users or unverified clients.
  - Runtime bootstrapped administrator `betzitian@gmail.com` is granted administrative access.
- **PII Isolation**: User email and identifying profile details are restricted to the user or administrators.

## 2. The Dirty Dozen Malicious Payloads (Negative Test Vectors)
1. **Unauthenticated Read on Users**: Anonymous/unauthenticated `GET /users/some_uid`. (Expected: PERMISSION_DENIED)
2. **Unauthenticated Write on Users**: Anonymous/unauthenticated `SET /users/attacker_uid`. (Expected: PERMISSION_DENIED)
3. **Identity Spoofing on Create**: Authenticated user `uid_alice` creates `/users/uid_bob` with `uid: "uid_bob"`. (Expected: PERMISSION_DENIED)
4. **Self-Promotion to Admin on Create**: Authenticated user `uid_charlie` creates `/users/uid_charlie` with `role: "admin"` while not an existing admin. (Expected: PERMISSION_DENIED)
5. **Privilege Escalation on Update**: Authenticated user `uid_david` (employee) updates `/users/uid_david` changing `role: "employee"` to `role: "admin"`. (Expected: PERMISSION_DENIED)
6. **Path Traversal / ID Poisoning**: Authenticated user attempts write with 2000-character malicious path ID or invalid characters like `/users/..%2F..%2Fhack`. (Expected: PERMISSION_DENIED)
7. **Ghost Field Injection (Shadow Update)**: User updates `/users/uid_alice` passing unlisted field `isVerifiedAdmin: true`. (Expected: PERMISSION_DENIED)
8. **Tampering with Immutable Fields**: User updates `/users/uid_alice` attempting to change `uid` or `createdAt`. (Expected: PERMISSION_DENIED)
9. **Unverified Email Administrator Spoof**: An unverified account claiming email `betzitian@gmail.com` without `email_verified == true` attempts to read `/admins/xyz`. (Expected: PERMISSION_DENIED)
10. **Admin Record Direct Injection**: Employee `uid_eve` writes directly to `/admins/uid_eve` setting `{ role: "admin" }`. (Expected: PERMISSION_DENIED)
11. **Denial-of-Wallet Payload**: User attempts to set `displayName` with a 2MB string exceeding 120 chars. (Expected: PERMISSION_DENIED)
12. **Blanket Query Scraping**: Employee queries `collection('users')` without a specific filter matching their own UID. (Expected: PERMISSION_DENIED)
