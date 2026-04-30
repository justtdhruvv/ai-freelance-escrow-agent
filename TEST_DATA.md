# Test Data — AI Freelance Escrow Platform

## URLs
- Frontend: https://escrow.dhruvautomates.in
- Backend API: https://escrow-api.dhruvautomates.in

---

## Test Accounts

### Employer Account
| Field | Value |
|-------|-------|
| Email | employer@test.com |
| Password | Test@1234 |
| Role | employer |

### Freelancer Account
| Field | Value |
|-------|-------|
| Email | freelancer@test.com |
| Password | Test@1234 |
| Role | freelancer |

> Sign up both accounts first before testing anything else. Use incognito for the second account.

---

## Project Data (create as employer)

| Field | Value |
|-------|-------|
| Title | E-Commerce Dashboard UI |
| Description | Build a responsive admin dashboard for an e-commerce platform. Includes product management, order tracking, and analytics charts. Must use React and Tailwind CSS. |
| Budget | ₹15,000 |
| Skills | React, Tailwind CSS, TypeScript |
| Deadline | 30 days from today |

### Milestones
| # | Name | Amount | Description |
|---|------|--------|-------------|
| 1 | UI Wireframes & Design | ₹3,000 | Figma wireframes for all 5 screens |
| 2 | Frontend Implementation | ₹8,000 | Fully coded React components with Tailwind |
| 3 | Final Delivery & Review | ₹4,000 | Bug fixes, code cleanup, deployment |

---

## Razorpay Test Payment

Use these cards in test mode — no real money is charged.

### Test Card (Visa)
| Field | Value |
|-------|-------|
| Card Number | 4111 1111 1111 1111 |
| Expiry | 12/28 |
| CVV | 123 |
| Name | Test User |
| OTP (if asked) | 1234 |

### Test Card (Mastercard)
| Field | Value |
|-------|-------|
| Card Number | 5267 3181 8797 5449 |
| Expiry | 12/28 |
| CVV | 123 |
| OTP (if asked) | 1234 |

### Test UPI
| Field | Value |
|-------|-------|
| UPI ID | success@razorpay |

---

## Freelancer Submission Data (submit as freelancer)

### Milestone 1 Submission
| Field | Value |
|-------|-------|
| Title | Wireframes — E-Commerce Dashboard |
| Description | Completed all 5 screen wireframes: Dashboard overview, Product list, Order management, Customer profiles, Analytics. Figma link attached. |
| Link / Repo | https://github.com/test/ecommerce-dashboard |
| Notes | Used mobile-first approach. All components are reusable. |

### Milestone 2 Submission
| Field | Value |
|-------|-------|
| Title | React Components — Complete |
| Description | Implemented all dashboard screens in React + Tailwind. Includes dark mode support, responsive layout, and chart integrations using Recharts. |
| Link / Repo | https://github.com/test/ecommerce-dashboard |
| Notes | 47 components total. Test coverage at 80%. |

---

## Dispute Data

| Field | Value |
|-------|-------|
| Type | quality |
| Subject | Milestone 2 does not match requirements |
| Description | The freelancer submitted the frontend but it is missing the analytics charts and the mobile layout is broken on screens below 768px. The agreed scope included both. Requesting partial refund of ₹3,000 or a revision. |
| Milestone | Milestone 2 — Frontend Implementation |

---

## Client Brief Data (if applicable)

| Field | Value |
|-------|-------|
| Company Name | ShopEasy Pvt Ltd |
| Industry | E-Commerce |
| Project Type | Web Application |
| Target Audience | Small business owners |
| Key Requirements | Fast load time, mobile responsive, easy product upload |
| Timeline | 4 weeks |
| Budget Range | ₹10,000 – ₹20,000 |

---

## Quick Reference — Test Flow Order

1. Sign up employer → Sign up freelancer
2. Login as employer → Create project with milestones above
3. Login as freelancer → Find project → Apply
4. Login as employer → Select freelancer → Fund Milestone 1 escrow (use test card)
5. Login as freelancer → Submit Milestone 1 (use submission data above)
6. Check AQA result appears
7. Login as employer → Approve Milestone 1 → Payment releases
8. Fund Milestone 2 → freelancer submits → raise dispute (use dispute data)
9. Resolve dispute → check wallet balances on both accounts
