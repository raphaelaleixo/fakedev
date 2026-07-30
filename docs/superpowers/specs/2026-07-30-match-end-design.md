# Match end

*Design, 2026-07-30. What the game does when somebody reaches five points.*

## The problem

The match-end **logic** is complete and tested. `applyRoundOutcome` (`round.ts`)
sets `status: "finished"` and writes `winnerIds`, handling the shared win where
several players cross the target together. `advanceMatch` deliberately keeps the
finished round on screen rather than cutting to a scoreboard.

The match-end **experience** stops halfway:

1. **The room is a dead end.** `ResolutionScreen` replaces the *Next round*
   button with a static winner line, and there is no other control anywhere.
   `startNextRound` throws once the match is finished. A room that has produced
   a winner can never do anything again — playing again means someone opens the
   homepage, hits New game, and the whole table rejoins by QR with no prompting.
2. **The controllers never learn the match ended.** `PlayerPage`'s
   `phase === "result"` branch shows *The round has ended / See the results on
   the big screen* — the same words as every other round. The player who just
   won a match is told a round finished.
3. **`rules.md` promises a state that doesn't exist:** "**Match end** — winner
   and final standings", listed alongside Lobby, Vote, Steal and Resolution.

## Decisions

**New game means a new room.** Not a rematch. The button does exactly what the
cover's New game does — creates a room and lands the big screen on its lobby.
Nothing is preserved: not the room, not the seats, not the scores, not the used
Secret pools. Players rejoin from the new lobby's QR.

Considered and rejected: keeping the room `started` and dealing a fresh match
into the same seats. It preserves the table across matches, but it also
preserves a player who has left — their seat still blocks the turn loop — and
it needs a `restartMatch` domain function, a `set`-not-`update` write to avoid a
stale `winnerIds` surviving the merge, and rematch semantics in the match state.
Also rejected: returning the room to the lobby, which `react-gameroom` cannot do
(`RoomStatus` is `"lobby" | "started"` and `startGame` only goes one way) and
which would have required proposing a library change first.

Starting from the cover's own path costs none of that. **This design adds no
game logic and needs nothing from `react-gameroom`.**

**No new screen.** The resolution screen stays as it is — final board, render,
the Secret, the Impostor, the scoreboard that already marks winners via `won`.
The winner line and the new button occupy the slot *Next round* used to hold.
This follows the decision already recorded in `match.ts`: the table should read
the result rather than be cut to a scoreboard. The standings beat that `rules.md`
imagines is served by the scoreboard that is already on screen; it does not
re-sort or renumber.

**The controller ends personally.** The TV is the shared ending, so the phone is
the only surface where a player's own result can land. It says whether *you* won
and what you finished with.

**The phones are left behind, and that is accepted.** When the big screen
navigates to a new room, every controller still points at the old one. They will
sit on their match-end screen indefinitely; a controller cannot detect this,
because the new room has a different id. Players notice the new lobby on the TV
and re-scan. No warning copy on the controller — the table is looking up, which
is the posture the whole design takes.

## Changes

### Big screen — `components/canvas/ResolutionScreen.tsx`

The `Answer` component currently renders either the *Next round* button
(`finished === false`) or a static flame winner line (`finished === true`). The
finished branch becomes **both**: the winner line, then the button beneath it.

The button calls `useOpenRoom().open()`. That hook already owns this behaviour
for the cover and the join screen — it guards double presses, exposes `opening`
and `failed`, and does the `requestAnimationFrame` + `flushSync` dance that makes
the view transition animate against a committed state. Its doc comment records
that these call sites had drifted and were unified deliberately; this is the
third caller, not a new pattern.

`ResolutionScreen` therefore calls the hook itself. It does not take a new prop
and `RoomPage` is unchanged.

**Copy.** Reuse `home.newGame` ("New game"), `home.newGamePending` ("Opening…")
and `home.newGameFailed`. The label must not be "Play again", which would promise
the table carries over.

*Known wart:* three `home.*` keys read on a canvas screen. They are the action's
copy rather than the cover's, and duplicating the strings under `result.*` to fix
the namespace would mean two places to edit one sentence. If it grates later,
promoting them to a shared key is a mechanical rename.

### Controller — `pages/PlayerPage.tsx`

The `phase === "result"` branch splits on `matchState.status`. `matchState` is
already destructured from `useGame()` at the top of the component, so no new data
flows in.

- `status !== "finished"` — unchanged (*The round has ended*).
- `status === "finished"`, player in `winnerIds` — **You won** and their final
  score from `matchState.scores`. A shared win reads the same: you won.
- `status === "finished"`, player not in `winnerIds` — the winner's name (joined
  with `&` for a shared win, as the TV does) and *You finished with N*.

Both keep the existing *See the results on the big screen* note, and the Secret
bar is untouched — that round's Secret is public on the TV by then.

New keys under `controller`: `youWon` ("You won"), `yourFinalScore`
("{{score}} points") and `youFinished` ("You finished with {{score}}"). The
winner's name reuses the existing `result.matchWinner` rather than duplicating
the same sentence in a second namespace — the same trade already accepted for
`home.newGame` above.

### Docs

`rules.md`'s big-screen list currently promises "**Match end** — winner and final
standings" as its own state. Correct it to describe what this builds: the
resolution screen holds, with the winner named and the way to a new game on it.

## Testing

`ResolutionScreen.test.tsx`

- The new-game button renders only when `finished`; a mid-match resolution still
  shows *Next round*.
- Pressing it calls through to room creation, and a second press while `opening`
  does not create a second room.
- The winner line still renders beside it, including the shared-win join.

Calling `useOpenRoom` inside `ResolutionScreen` puts `useNavigate` in that
component's tree, so its existing tests need a router wrapper they don't have
today. Check the sibling tests for the wrapper already in use rather than
inventing one.

`PlayerPage.test.tsx`

- Winner sees *You won* and their score.
- Non-winner sees the winner's name and their own final score.
- A `result` phase with `status: "playing"` is unchanged — this is the
  regression that matters, since the branch is shared.

No new `match.ts` or `round.ts` tests: this design adds no domain logic.

## Out of scope

- Any rematch that preserves seats or scores.
- A dedicated match-end screen, animated standings, or end-of-match awards.
- Cleaning up abandoned rooms in Firebase. Rooms already accumulate — every
  New game writes one and nothing deletes it. This changes nothing about that,
  and fixing it is a separate piece of work.
