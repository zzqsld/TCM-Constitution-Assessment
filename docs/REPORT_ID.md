# Report ID Algorithm

Pattern: `TCMYYYYMMDD` + 5-character stage token.

## Stages
1. Digits only: `00001`–`99999`
2. 1 letter + 4 digits: `A0001`–`Z9999`
3. 2 letters + 3 digits: `AA001`–`ZZ999`
4. 3 letters + 2 digits: `AAA01`–`ZZZ99`
5. 4 letters + 1 digit: `AAAA1`–`ZZZZ9`
6. 5 letters: `AAAAA`–`ZZZZZ`

Each day counter resets; index maps monotonically across cumulative capacities of each stage.

## Forward Mapping (`__indexToToken`)
- Determine stage by subtracting cumulative capacities.
- Compute letter group (base‑26) and numeric part (zero-padded when digits > 0).

## Reverse Mapping (`__tokenToIndex`)
- Infer letters/digits count → stage.
- Convert letters base‑26 → group index.
- Combine with numeric offset and prior stage cumulative sum.

## Design Goals
- Human-friendly progression.
- Upper bound large enough for high daily volume.
- Reversible without external storage.

## Collision Handling
No collisions; strictly sequential per day.

## Edge Cases
- Index <1 or >max: guarded.
- Token length must be 5; invalid patterns rejected.

## Example
- Day start: index=1 → `00001`
- After 99,999 entries: index=100000 → `A0001`

## Future Extension
- If volume surpasses final stage, add stage with 6 letters (requires code change).
