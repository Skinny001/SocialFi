# PRD 04: SocialFi

**Tagline:** A Web3 Twitter on BOT Chain. Posts, follows and tips live on-chain, and creators earn BOT for posting and engagement.
**Target:** BOT Chain Testnet (chain ID 968)
**Stack:** Solidity ^0.8.24, Foundry (forge), OpenZeppelin v5, Next.js (App Router), ethers v6

---

## 0. Common setup (same in every PRD)

| Item | Value |
|---|---|
| Network | BOT Chain Testnet |
| Chain ID | 968 (hex `0x3C8`) |
| RPC | `https://rpc.bohr.life` |
| Explorer | `https://scan.bohr.life` |
| Native token | tBOT (gas). Faucet: `https://faucet.botchain.ai/basic`, 10 tBOT per address per 24h |
| USDT (testnet) | `0x75edC9335175Fc0552D51D48439F229c10420fe3` |

Rules for the whole build:
- The docs do not state USDT decimals. Always read `decimals()` from the token if you use it. Never hardcode.
- This project uses the **native coin (tBOT)** for tips and rewards, so USDT is optional here.
- Do not rely on `eth_getLogs` for core data. The feed must be read from contract state with paginated view functions.
- Deploy with: `forge script script/Deploy.s.sol --rpc-url https://rpc.bohr.life --broadcast --private-key $PRIVATE_KEY`. Add `--legacy` if you hit a gas price error.
- tBOT is limited (10 per day per address). Test locally with `forge test` first, and set reward and tip amounts very small for testnet.

---

## 1. Overview

SocialFi is a minimal on-chain social network. Users claim a unique handle, post short text, follow others, like posts, and tip creators in tBOT. Creators earn small BOT rewards from a pool funded by the platform, with strict caps so bots cannot farm the pool.

The hard problem is not storage, it is incentives. This PRD builds the anti-abuse rules into the contract.

## 2. Assumptions (decisions already made)

1. **Post text is stored on-chain** (max 280 bytes) so the feed works without log queries. Longer content is out of scope.
2. **Native coin only:** tips and rewards are paid in tBOT (native). No ERC20 needed.
3. **Reward pool:** The admin funds a `RewardPool` by sending tBOT to the contract. Rewards are paid from the pool. When the pool is empty, posting still works but earns nothing.
4. **Reward rules (all configurable by admin):**
   - A post earns a flat `postReward` only for the first `maxRewardedPostsPerDay` posts per user per UTC day (default 3).
   - A like from a **different, registered** address earns the author `likeReward`, capped at `maxRewardedLikesPerPost` (default 20) per post. Self-likes earn nothing.
   - Minimum `minPostInterval` seconds between posts (default 30s).
   - A user needs a registered handle and must hold no more than `maxHandlesPerAddress` = 1 handle.
5. **Moderation:** Posts cannot be deleted from the chain. Authors can "hide" their own post, and a `Moderator` role can hide any post. Hidden posts return a flag so the frontend does not render the text.
6. **Tipping:** A tip is a direct native transfer to the author, with a platform fee of 0% in MVP (leave a fee variable at 0 for flexibility).

## 3. Users and roles

| Role | Can do |
|---|---|
| Admin | Fund pool, set reward parameters, add/remove moderators, pause |
| Moderator | Hide posts |
| User | Register handle, post, reply, like, follow, tip |

## 4. User stories

- As a new user, I register a unique handle (3 to 20 chars, lowercase letters, digits, underscore).
- As a user, I write a post, and my feed shows posts from people I follow, plus a global feed.
- As a user, I follow and unfollow other users.
- As a reader, I like a post and tip the author with a custom amount.
- As a creator, I see my total earned rewards and tips, and claim pending rewards.
- As a user, I reply to a post (replies are posts with `parentId`).
- As a user, I hide one of my posts.

## 5. Scope

**MVP:** handles, posts, replies, likes, follows, tips, reward accrual and claim, global feed, following feed, profile pages, hide/moderation.

**Out of scope:** media uploads, DMs, algorithmic ranking, token launch, off-chain indexing, notifications.

## 6. Smart contract specification

### 6.1 Contracts

1. `SocialFi.sol`: everything (profiles, posts, graph, tips, rewards).
2. Optionally split into `Profiles.sol` and `Posts.sol` if you want smaller files.

### 6.2 Data structures

```solidity
struct Profile {
    string handle;
    string bio;               // max 160 bytes
    string avatarCid;         // optional
    uint32 followers;
    uint32 following;
    uint32 postCount;
    uint64 createdAt;
    bool exists;
}

struct Post {
    uint256 id;
    address author;
    string text;              // max 280 bytes
    uint256 parentId;         // 0 = top-level
    uint64 createdAt;
    uint32 likes;
    uint32 replies;
    uint256 tipsReceived;     // total tBOT tipped on this post
    bool hidden;
}
```

State:
- `mapping(address => Profile) profiles`
- `mapping(bytes32 => address) handleOwner` (key = keccak256 of lowercase handle)
- `Post[] posts` (id = index + 1; keep index 0 unused) or `mapping(uint256 => Post)` with a counter
- `mapping(address => uint256[]) postsByAuthor`
- `mapping(uint256 => mapping(address => bool)) liked`
- `mapping(address => mapping(address => bool)) isFollowing`
- `mapping(address => address[]) followingList` (optional; or compute following feed client-side)
- `mapping(address => uint256) pendingRewards`, `mapping(address => uint256) totalEarned`
- `mapping(address => mapping(uint32 => uint8)) rewardedPostsPerDay` (key = day number `block.timestamp / 1 days`)
- `mapping(uint256 => uint16) rewardedLikes`
- `mapping(address => uint64) lastPostAt`
- Reward config: `postReward`, `likeReward`, `maxRewardedPostsPerDay`, `maxRewardedLikesPerPost`, `minPostInterval`

### 6.3 Functions

| Function | Behavior |
|---|---|
| `registerHandle(handle, bio, avatarCid)` | Validates handle format and uniqueness; one per address |
| `updateProfile(bio, avatarCid)` | Owner only |
| `createPost(text, parentId)` | Requires profile; text length 1..280 bytes; enforces `minPostInterval`; if `parentId != 0` it must exist and increments parent's replies; accrues `postReward` if within the daily cap and pool balance covers all pending rewards |
| `likePost(postId)` | Requires profile; once per user per post; self-like allowed but earns nothing; accrues `likeReward` to author under the per-post cap and pool coverage |
| `follow(user)` / `unfollow(user)` | Requires profiles on both sides; cannot follow self; updates counters |
| `tip(postId)` payable | `msg.value > 0`; forwards value to author immediately using a call; increments `tipsReceived`; reverts if post hidden; use ReentrancyGuard |
| `claimRewards()` | Pays `pendingRewards[msg.sender]` from the contract and zeroes it first (checks-effects-interactions) |
| `hidePost(postId)` | Author or Moderator |
| Admin: `fundPool()` payable (or plain `receive`), `setRewardConfig(...)`, `addModerator/removeModerator`, `pause/unpause` | |
| Views | `getPost(id)`, `getPosts(offset, limit)` (global, newest first helper), `getPostsByAuthor(author, offset, limit)`, `getReplies(parentId, offset, limit)` (maintain `repliesOf[parentId]` array), `getProfile(addr)`, `handleToAddress(handle)`, `poolBalance()` |

**Reward solvency rule:** keep `totalPending` and only accrue a reward if `address(this).balance >= totalPending + reward + 0` (and tips are never held in the contract, they are forwarded immediately). This guarantees every accrued reward can be claimed.

Following feed: the contract only exposes `isFollowing` and `followingList(user)`. The frontend fetches recent posts for each followed author with `getPostsByAuthor` and merges them client-side.

### 6.4 Events

`HandleRegistered`, `PostCreated(id, author, parentId)`, `Liked`, `Followed`, `Unfollowed`, `Tipped(postId, from, to, amount)`, `RewardAccrued(user, amount, reason)`, `RewardClaimed`, `PostHidden`.

### 6.5 Security checklist

- Reentrancy guard on `tip` and `claimRewards`.
- Anti-farming: daily cap, per-post like cap, minimum interval, one handle per address. State clearly in the README that this reduces but does not eliminate sybil attacks, because a user can create many addresses. Mitigation idea for later: require a small deposit to register.
- Text length uses `bytes(text).length`; reject empty or whitespace-only.
- Handle validation loops over at most 20 bytes.

## 7. Frontend specification (Next.js + ethers v6)

### 7.1 Pages

| Route | Purpose |
|---|---|
| `/` | Global feed, composer at the top, infinite scroll using `getPosts(offset, limit)` |
| `/following` | Merged feed from followed authors |
| `/u/[handle]` | Profile: bio, counts, follow button, their posts, total earned |
| `/post/[id]` | Post with replies and reply composer |
| `/rewards` | Pending rewards, earned totals, claim button, current reward rules |
| `/register` | Handle registration (first-time flow) |
| `/admin` | Fund pool, set parameters, moderators (admin only) |

### 7.2 Behavior

- Wallet connect and chain switch per the common setup.
- First-time user: redirect to `/register` if the address has no profile.
- Optimistic UI for likes and follows with rollback on failure.
- Tip dialog with quick amounts (for testnet use 0.001, 0.005, 0.01 tBOT) and a custom input.
- Polling every 10 to 15 seconds for new posts is acceptable (no websockets needed).
- Render hidden posts as "Post hidden by author/moderator". Never render hidden text.
- Sanitize text on render (React escapes by default; do not use `dangerouslySetInnerHTML`).
- Show a gas hint: each post is a transaction, so tBOT is required.

## 8. Off-chain data

Avatars only (IPFS CID or a static image). All post data is on-chain.

## 9. Foundry test plan

- Handle: valid and invalid formats, uniqueness (case-insensitive), one per address.
- Posting: length bounds, interval enforcement via `vm.warp`, reply counters, hidden post rules.
- Rewards: daily cap per user; day rollover with `vm.warp`; like cap per post; self-like earns nothing; no accrual when pool is insufficient; claim pays exactly pending and zeroes it.
- Solvency invariant: `address(this).balance >= totalPending` after any sequence of operations.
- Tipping: forwards exact amount, reverts on hidden post or zero value, reentrancy attack contract fails.
- Follow: counters, no self-follow, no double follow.
- Moderation: only author or moderator can hide.
- Fuzz: random sequences of post, like, claim.

## 10. Project structure

```
socialfi/
  contracts/ src/SocialFi.sol
             test/SocialFi.t.sol
             script/Deploy.s.sol, script/FundPool.s.sol
  web/ app/..., components/Feed.tsx, Composer.tsx, PostCard.tsx, TipDialog.tsx
       lib/
  README.md
```

Env: `PRIVATE_KEY`, `NEXT_PUBLIC_SOCIAL_ADDRESS`, `NEXT_PUBLIC_RPC=https://rpc.bohr.life`.

## 11. Build order

1. Profiles + posts + tests. 2. Follow + like + tips. 3. Rewards with solvency rule + tests. 4. Deploy and fund pool with a small amount. 5. Feed, composer, profile. 6. Tips, rewards page. 7. Admin, moderation, polish, README.

## 12. Acceptance criteria

- [ ] All forge tests pass, including the solvency invariant.
- [ ] Testnet deployment with addresses in README.
- [ ] Feed works with no `eth_getLogs` dependency.
- [ ] Reward caps visibly enforced (a user who spams earns nothing extra).
- [ ] Tips arrive at the author in the same transaction.
- [ ] README states the sybil limitation honestly.

## 13. Risks and notes

- Everything on-chain is public and permanent; add a content warning at registration.
- Gas per post is the main cost; keep structs compact (use `uint32` and `uint64` packing).
- With 10 tBOT per day from the faucet, fund the reward pool with a very small amount and set rewards to fractions of 0.001 tBOT.
