# AI Features Roadmap

This document tracks AI-related UI/UX placeholders already added and the
planned capabilities to be implemented later. The goal is to keep this
list actionable for both frontend and backend work.

## 1) Placed UI placeholders (UI only)

- Home: "맞춤 추천" section (login-only, Done).
- Auction detail: "비슷한 경매" section (Done).
- Wishlist: "찜 기반 추천" section (Done).
- Auction registration: "AI 시작가 추천" card (Done).
- Product registration: "AI 상세설명 초안 생성" entry (Done).
- In-app chatbot: "More Assistant" entry (Done).

## 2) MVP v1 (rules-first recommendations + AI assist)

### Recommendations (rules/stat-based)

- Home personalized recommendations (login users).
- Similar auctions (category/price/keywords).
- Wishlist-based recommendations (use wishlist product ids). (Done)

### AI Assist (AI keyword OK)

- AI start bid suggestion on auction registration. (Done)
- AI product description draft generation. (Done)
- In-app chatbot (FAQ + contextual guidance, RAG-first).

## 3) Additional ideas (post-MVP)

- Search: query correction and keyword expansion.
- Notifications: priority scoring (important first).
- MyPage: bidding habit summary and deposit guidance.
- Price trend badges: "최근 낙찰 평균가" vs current bid.

## 4) Data requirements (minimum)

- User behavior events: view, bid, wishlist, search.
- Auction/product metadata: category, price, status, end time, keywords.
- Auction results: final bid price, winnerId.
- (Chatbot) Knowledge base docs + versioning.

## 5) Suggested API endpoints (draft)

### Recommendations

- GET /api/v1/recommendations/me
- GET /api/v1/auctions/{auctionId}/similar
- GET /api/v1/recommendations/wishlist

### AI Assist

- POST /api/v1/auctions/price-suggestion
- POST /api/v1/products/description-draft
- POST /api/v1/chat

## Notes

- Recommendations MVP can start with rules (category/price/recency) and upgrade later (embeddings/ML).
- Keep responses small and cacheable on the client.
