# HLD: British Auction RFQ System

## Goal

Provide a simple RFQ platform where:

- buyers create British Auction enabled RFQs
- suppliers submit live competing bids
- the system auto-extends auctions near close based on configurable rules
- bidding never continues beyond the forced close time

---

## Architecture Diagram

![Architecture Diagram](architecture_hld.png)

### Main Components

**Frontend**
- React + Vite single-page app
- Zustand store for RFQ, bid, log, and socket state
- Tailwind UI for listing, detail, and create flows

**Backend**
- Express REST APIs for RFQs and bids
- Service layer for validation, ranking, and extension rules
- Socket.io for live auction updates
- Scheduler to activate pending auctions and close expired ones

**Database**
- MongoDB stores RFQs, bids, and auction logs
- Latest bids are tracked per supplier using `isLatestBySupplier`

---

## Request Flow

### Create RFQ

1. Frontend submits RFQ payload
2. Backend validates timings and config
3. Backend generates `referenceId`
4. RFQ is stored with initial lifecycle status

### Submit Bid

1. Frontend posts bid payload
2. Backend validates auction state and bid payload
3. Previous latest bid from the same supplier is marked stale
4. New bid is saved
5. Rankings are recomputed
6. Extension logic evaluates whether to extend
7. Logs and socket events are emitted

### Live Update Flow

1. Viewer joins `join:auction`
2. Backend adds the socket to the RFQ room
3. New bids and extensions emit room-scoped events
4. UI updates bid table, countdown, activity log, and viewer count

---

## Lifecycle Model

![Lifecycle Diagram](lifecycle_state_machine.png)

RFQ statuses:

- `pending`
- `active`
- `extended`
- `closed`
- `force_closed`
- `no_bids`

Lifecycle rules:

- Pending auctions become active once the start time passes
- Active or extended auctions close once effective close time passes
- Auctions never extend beyond forced close time
- No-bid auctions are marked `no_bids`

---

## British Auction Rule Engine

Configurable inputs:

- `triggerWindowMinutes`
- `extensionDurationMinutes`
- `extensionTrigger`
- `minimumDecrementType`
- `minimumDecrementValue`
- `maxExtensions`

Supported triggers:

- `BID_RECEIVED` — extends on any new bid inside the trigger window
- `ANY_RANK_CHANGE` — extends only if rankings shifted
- `L1_RANK_CHANGE` — extends only if the L1 position changed

Extension is blocked if `extensionCount >= maxExtensions` or if the new close time would exceed `forcedBidCloseTime`.

---

## Design Notes

- Ranking is deterministic: lower total wins, earlier submission breaks ties.
- Extension logic is isolated from controllers inside the service and utility layers.
- Socket events are room-based, keeping real-time traffic scoped per RFQ.
- Scheduler logic keeps long-running auction state aligned even without user interaction.