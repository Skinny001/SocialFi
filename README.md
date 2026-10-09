# SocialFi

**The Open Social Graph**

SocialFi is a decentralized social network built on BOT Chain where your posts, reputation, and community value belong to you. Experience a vibrant, high-performance UI combined with the censorship resistance and direct monetization of Web3.

<div align="left">
  <img src="./public/logo.jpg" alt="SocialFi Logo" width="100" />
</div>

## ✨ Features

- **Wallet-Native Identity:** Connect with MetaMask and claim your unique on-chain handle.
- **On-Chain Posting:** Publish permanent, immutable content directly to the BOT Chain.
- **Direct Monetization:** Tip creators instantly in native `tBOT` with zero platform fees.
- **Network Rewards:** Earn automated tBOT rewards simply for posting and receiving engagement.
- **Interactive Feed:** A sleek, fully responsive dynamic UI.
- **Bookmarking:** Save posts to your personal local archive for later reading.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons
- **Web3 Integration:** ethers.js v6
- **Smart Contracts:** Solidity, Foundry, OpenZeppelin
- **Network:** BOT Chain Testnet

## 📜 Deployed Contracts

The core protocol is currently deployed and verified on the **BOT Chain Testnet** (Chain ID `968` / `0x3c8`).

- **SocialFi Core:** `0x70A838Ebfc7f0457cE1555a961AF9EE791d38f81`
- **RPC URL:** `https://rpc.bohr.life`
- **Currency:** tBOT

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MetaMask (or equivalent Web3 wallet)
- Testnet tBOT tokens (to deploy and interact)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Social-Fi
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_SOCIAL_ADDRESS=0x70A838Ebfc7f0457cE1555a961AF9EE791d38f81
   NEXT_PUBLIC_RPC=https://rpc.bohr.life
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

## ⛓️ Smart Contracts

The core logic of SocialFi runs completely on-chain via the `SocialFi.sol` contract.

### Contract Deployment (Foundry)

1. Navigate to the contracts directory:
   ```bash
   cd contracts
   ```

2. Install dependencies:
   ```bash
   forge install
   ```

3. Compile the contracts (with the optimizer enabled):
   ```bash
   forge build
   ```

4. Deploy and verify on BOT Chain Testnet:
   ```bash
   forge create --rpc-url https://rpc.bohr.life \
     --private-key YOUR_PRIVATE_KEY \
     --verify \
     --verifier sourcify \
     src/SocialFi.sol:SocialFi \
     --constructor-args YOUR_OWNER_ADDRESS
   ```

## 📂 Architecture Overview

- **`app/page.tsx`**: Main application interface containing the feed, explore page, profile view, rewards dashboard, and wallet connection logic.
- **`components/landing-page.tsx`**: The promotional landing page users see before connecting a wallet.
- **`contracts/src/SocialFi.sol`**: The core smart contract governing profiles, posts, tips, and reward accrual.
- **`contracts/test/SocialFi.t.sol`**: Comprehensive Foundry test suite ensuring contract security.

## 📄 License

This project is licensed under the MIT License.
