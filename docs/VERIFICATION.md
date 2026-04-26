# Verification Notes

The following checks were executed locally against the current project state.

## Backend Logic Cases

Run locally with:

```bash
cd backend
npm run verify
```

- RFQ creation rejects `forcedBidCloseTime <= bidCloseTime`
- Auction extension never exceeds `forcedBidCloseTime`
- `L1_RANK_CHANGE` does not extend when the same supplier remains L1
- `L1_RANK_CHANGE` does not extend on the very first bid
- `ANY_RANK_CHANGE` does not extend when a supplier rebids without changing ranking
- Pending auctions auto-activate on read
- Pending auctions auto-activate on bid submission
- Pending auctions auto-activate through the scheduler
- Rank tie-break keeps the earlier equal-price bid ahead

## Frontend Check

- `frontend` production build passes with `npm run build`

## Notes

- The verification cases were run directly against the backend services and MongoDB connection used by the project environment.
- The frontend build completed successfully after the theme update and listing card changes.
