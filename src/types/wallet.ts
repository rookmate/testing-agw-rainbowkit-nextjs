import type { SessionConfig, SessionClient } from "@abstract-foundation/agw-client/sessions";

import { tokenAbi } from '@/abis/RookToken';

export interface SessionKeyData {
  privateKey: `0x${string}`;
  address: `0x${string}`;
  expiresAt: string;
  session: SessionConfig;
  transactionHash?: `0x${string}`;
}

export interface SessionKeyManagerProps {
  address: string;
  onSessionClientCreated: (client: SessionClient | null) => void;
}

export interface WalletConnectionProps {
  address: string;
  logout: () => void;
}

export interface WalletActionsProps {
  logout: () => void;
  address: string;
  sessionClient: SessionClient | null;
  onMintComplete: (hash: `0x${string}`) => void;
}

export interface SubmitTransactionButtonProps {
  address: string;
  sessionClient: SessionClient | null;
  onMintComplete: (hash: `0x${string}`) => void;
}

// You can also add contract-related types
export interface TokenContract {
  address: `0x${string}`;
  abi: typeof tokenAbi;
}
