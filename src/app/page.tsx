"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { useCreateSession, useLoginWithAbstract, useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { createSessionClient, LimitType } from "@abstract-foundation/agw-client/sessions";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { parseAbi, parseEther, toFunctionSelector, http, stringify } from "viem";
import { getGeneralPaymasterInput } from "viem/zksync";
import { abstractTestnet } from "viem/chains";

import BackgroundEffects from "@/components/BackgroundEffects";
import HeaderSection from "@/components/HeaderSection";
import ResourceCards from "@/components/ResourceCards";

// Transaction details component
const TransactionDetails = ({ transactionReceipt }) => {
  if (!transactionReceipt) return null;

  return (
    <a
      href={`https://explorer.testnet.abs.xyz/tx/${transactionReceipt?.transactionHash}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <p className="text-sm sm:text-base font-medium font-[family-name:var(--font-roobert)] mb-1">
        Transaction Status: {transactionReceipt?.status}
      </p>
      <p className="text-xs text-gray-400 font-mono">
        {transactionReceipt?.transactionHash?.slice(0, 8)}...
        {transactionReceipt?.transactionHash?.slice(-6)}
      </p>
    </a>
  );
};

// Session key management component
const SessionKeyManager = ({ address, onSessionCreated, onSessionClientCreated }) => {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionKey, setSessionKey] = useState(null);
  const { createSessionAsync } = useCreateSession();

  // Load session from localStorage on component mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem(`session-${address}`);
        if (!storedSession || sessionKey) return; // Don't reload if we already have a session

        const parsedSession = JSON.parse(storedSession);

        // Check if session has expired
        if (new Date(parsedSession.expiresAt) > new Date()) {
          setSessionKey(parsedSession);

          // Recreate session client
          const sessionSigner = privateKeyToAccount(parsedSession.privateKey);
          const sessionClient = createSessionClient({
            account: address,
            chain: abstractTestnet,
            signer: sessionSigner,
            session: parsedSession.session,
            transport: http(),
          });

          // Wrap callbacks in setTimeout to break the render cycle
          setTimeout(() => {
            onSessionCreated(parsedSession.session);
            onSessionClientCreated(sessionClient);
          }, 0);
        } else {
          // Clear expired session
          localStorage.removeItem(`session-${address}`);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem(`session-${address}`);
      }
    };

    if (address) {
      loadSession();
    }
  }, [address]); // Remove onSessionCreated and onSessionClientCreated from dependencies

  const createNewSession = async () => {
    try {
      setIsCreatingSession(true);

      // Generate session key
      const sessionPrivateKey = generatePrivateKey();
      const sessionSigner = privateKeyToAccount(sessionPrivateKey);

      // Create session with paymaster configuration
      const { session, transactionHash } = await createSessionAsync({
        session: {
          signer: sessionSigner.address,
          expiresAt: Math.floor(Date.now() / 1000 + 60 * 60 * 24), // 24 hours
          feeLimit: {
            limitType: LimitType.Lifetime,
            limit: parseEther("1"),
            period: 0,
          },
          callPolicies: [
            {
              target: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA",
              selector: toFunctionSelector("mint(address,uint256)"),
              valueLimit: {
                limitType: LimitType.Unlimited,
                limit: 0,
                period: 0,
              },
              maxValuePerUse: 0,
              constraints: [],
            }
          ],
          transferPolicies: [
            {
              target: address,
              maxValuePerUse: parseEther("0.1"),
              valueLimit: {
                limitType: LimitType.Allowance,
                limit: parseEther("1"),
                period: 60 * 60 * 24,
              },
            }
          ],
        },
        paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391",
        paymasterInput: getGeneralPaymasterInput({
          innerInput: "0x",
        }),
      });

      const sessionKeyData = {
        privateKey: sessionPrivateKey,
        address: sessionSigner.address,
        expiresAt: new Date(Number(session.expiresAt) * 1000).toISOString(),
        session,
        transactionHash,
      };

      // Store session in localStorage
      localStorage.setItem(`session-${address}`, stringify(sessionKeyData));

      // Update state
      setSessionKey(sessionKeyData);

      // Create session client and pass it to the parent
      const sessionClient = createSessionClient({
        account: address,
        chain: abstractTestnet,
        signer: sessionSigner,
        session,
        transport: http(),
      });

      onSessionCreated(session);
      onSessionClientCreated(sessionClient);

    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(`session-${address}`);
    setSessionKey(null);
    onSessionCreated(null);
    onSessionClientCreated(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Session Key Management</h3>
        {sessionKey ? (
          <div className="space-y-2">
            <p className="text-sm">Session Key Address</p>
            <p className="text-xs text-gray-400">{sessionKey.address}</p>
            <p className="text-sm">Expires: {new Date(sessionKey.expiresAt).toLocaleString()}</p>
            <p className="text-sm">Transaction capabilities</p>
            <p className="text-xs text-gray-400">NFT Minting & Token Transfers</p>
            <p className="text-sm">Transaction Hash:{' '}</p>
            <p className="text-xs text-gray-400">
              <a
                href={`https://explorer.testnet.abs.xyz/tx/${sessionKey.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                {sessionKey.transactionHash?.slice(0, 8)}...{sessionKey.transactionHash?.slice(-6)}
              </a>
            </p>
            <button
              className="rounded-full border border-solid border-red-500/20 transition-colors flex items-center justify-center bg-red-500/10 text-red-500 gap-2 hover:bg-red-500/20 text-sm h-10 px-5 font-[family-name:var(--font-roobert)] w-full mt-4"
              onClick={clearSession}
            >
              Revoke Session
            </button>
          </div>
        ) : (
          <button
            className="rounded-full border border-solid border-white/20 transition-colors flex items-center justify-center bg-white/10 text-white gap-2 hover:bg-white/20 text-sm h-10 px-5 font-[family-name:var(--font-roobert)] w-full"
            onClick={createNewSession}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <span>Creating Session...</span>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Session Key
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Wallet connection component
const WalletConnection = ({ address, logout, writeContractSponsored, transactionReceipt }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionClient, setSessionClient] = useState(null);

  const handleSessionCreated = (session) => {
    setActiveSession(session);
  };

  const handleSessionClientCreated = (client) => {
    setSessionClient(client);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 shadow-lg backdrop-blur-sm max-w-sm w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-400 font-mono">{address}</p>
          <p className="text-sm sm:text-base font-medium font-[family-name:var(--font-roobert)] mb-1">
            <a
              href={`https://explorer.testnet.abs.xyz/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
            </a>
          </p>
        </div>
        <SessionKeyManager
          address={address}
          onSessionCreated={handleSessionCreated}
          onSessionClientCreated={handleSessionClientCreated}
        />
        <WalletActions
          logout={logout}
          writeContractSponsored={writeContractSponsored}
          address={address}
          activeSession={activeSession}
          sessionClient={sessionClient}
        />
        <TransactionDetails transactionReceipt={transactionReceipt} />
      </div>
    </div>
  );
};

// Wallet action buttons
const WalletActions = ({ logout, address, sessionClient }) => (
  <div className="flex gap-2 w-full">
    <button
      className="rounded-full border border-solid border-white/20 transition-colors flex items-center justify-center bg-white/10 text-white gap-2 hover:bg-white/20 text-sm h-10 px-5 font-[family-name:var(--font-roobert)] flex-1"
      onClick={logout}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Disconnect
    </button>
    <SubmitTransactionButton address={address} sessionClient={sessionClient} />
  </div>
);

// Submit transaction button
const SubmitTransactionButton = ({ address, sessionClient }) => {
  const handleTransaction = async () => {
    if (!sessionClient) return;

    try {
      // Mint the NFT using sessionClient
      const tx = await sessionClient.writeContract({
        abi: parseAbi(["function mint(address,uint256) external"]),
        address: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA", // NFT contract
        functionName: "mint",
        args: [address, 1],
      });

      console.log("Transaction sent:", tx);

    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  };

  return (
    <button
      className={`rounded-full border border-solid transition-colors flex items-center justify-center text-white gap-2 text-sm h-10 px-5 font-[family-name:var(--font-roobert)] flex-1 w-[140px]
        ${!sessionClient
          ? "bg-gray-500 cursor-not-allowed opacity-50"
          : "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 border-transparent"
        }`}
      onClick={handleTransaction}
      disabled={!sessionClient}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span className="w-full text-center">
        {sessionClient ? 'Mint with Session' : 'Session Required'}
      </span>
    </button>
  );
};

// Main component
export default function Home() {
  const { logout } = useLoginWithAbstract();
  const { address, status } = useAccount();
  const { writeContractSponsored, data: transactionHash } = useWriteContractSponsored();
  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  return (
    <div className="relative grid grid-rows-[1fr_auto] min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-avenue-mono)] bg-black overflow-hidden">
      <BackgroundEffects />

      <main className="relative flex flex-col items-center justify-center z-10 text-white text-center">
        <div className="flex flex-col items-center gap-8">
          <HeaderSection />

          <p className="text-md font-[family-name:var(--font-roobert)]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              src/app/page.tsx
            </code>
            .
          </p>

          <div className="flex justify-center">
            {status === "connected" ? (
              <WalletConnection
                address={address}
                logout={logout}
                writeContractSponsored={writeContractSponsored}
                transactionReceipt={transactionReceipt}
              />
            ) : status === "reconnecting" || status === "connecting" ? (
              <div className="animate-spin">
                <Image src="/abs.svg" alt="Loading" width={24} height={24} />
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </main>

      <ResourceCards />
    </div>
  );
}
