// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { PageHeader } from "@/components/shared/PageHeader";
// import { EmptyState } from "@/components/ui/EmptyState";
// import { GameIcon } from "@/components/games/GameIcon";
// import { ConversionCard } from "@/components/wallet/ConversionCard";
// import { TakaWithdrawalCard } from "@/components/wallet/TakaWithdrawalCard";
// import { BalanceSummary } from "@/components/wallet/BalanceSummary";
// import { IncomeModeActivationModal } from "@/components/wallet/IncomeModeActivationModal";
// import { IncomeModeRestrictionModal } from "@/components/wallet/IncomeModeRestrictionModal";
// import { formatDateTime } from "@/lib/utils/format";
// import { TRANSACTION_TYPES } from "@/lib/constants/transactions";
// import { createClient } from "@/lib/supabase/client";
// import { useToast } from "@/components/shared/ToastProvider";
// import {
//   History,
//   ArrowRight,
//   Coins,
//   Banknote,
// } from "lucide-react";

// interface WalletContentProps {
//   initialWallet: {
//     coins: number;
//     total_earned: number;
//     total_redeemed: number;
//     taka_balance: number;
//     total_taka_withdrawn: number;
//   };
//   todayEarned: number;
//   transactions: Array<{
//     id: string;
//     type: string;
//     amount: number;
//     description: string;
//     created_at: string;
//   }>;
//   takaConversionSettings: any;
//   takaWithdrawalSettings: any;
//   minTakaWithdrawal: number;
//   minConversionCoins: number;
//   coinsPerTaka: number;
//   incomeModeStatus: string;
// }

// export function WalletContent({
//   initialWallet,
//   todayEarned,
//   transactions,
//   takaConversionSettings,
//   takaWithdrawalSettings,
//   minTakaWithdrawal,
//   minConversionCoins,
//   coinsPerTaka,
//   incomeModeStatus,
// }: WalletContentProps) {
//   const [wallet, setWallet] = useState(initialWallet);
//   const [restrictionModalOpen, setRestrictionModalOpen] = useState(false);
//   const [activationModalOpen, setActivationModalOpen] = useState(false);
//   const [incomeStatus, setIncomeStatus] = useState(incomeModeStatus);
//   const { toast } = useToast();

//   // Subscribe to live income mode status changes
//   useEffect(() => {
//     const supabase = createClient();
//     let userId = null;
//     let channel = null;

//     const load = async () => {
//       try {
//         const userRes = await supabase.auth.getUser();
//         userId = userRes?.data?.user?.id;
//         if (!userId) return;
//         const { data } = await supabase
//           .from("profiles")
//           .select("income_mode_status")
//           .eq("id", userId)
//           .maybeSingle();
//         if (data?.income_mode_status) {
//           setIncomeStatus(data.income_mode_status);
//         }

//         // Subscribe to live changes so admin actions (disable / enable / suspend) show up immediately
//         channel = supabase
//           .channel(`wallet-income-status-${userId}`)
//           .on(
//             "postgres_changes",
//             {
//               event: "UPDATE",
//               schema: "public",
//               table: "profiles",
//               filter: `id=eq.${userId}`,
//             },
//             (payload) => {
//               const next = payload?.new?.income_mode_status;
//               if (next) setIncomeStatus(next);
//             }
//           )
//           .subscribe();
//       } catch {
//         // ignore — DB may not have the column yet
//       }
//     };

//     load();

//     return () => {
//       if (channel) supabase.removeChannel(channel);
//     };
//   }, []);

//   // Update wallet balance from conversions etc.
//   const refreshWallet = async () => {
//     try {
//       const res = await fetch("/api/wallet/me", { cache: "no-store" });
//       if (res.ok) {
//         const data = await res.json();
//         if (data?.wallet) {
//           setWallet(data.wallet);
//         }
//       }
//     } catch {
//       // wallet stays as-is on transient errors
//     }
//   };

//   // Show restriction modal if user has a restricted or disabled income mode status.
//   // "disabled" status is also shown to prompt users to enable income mode.
//   const restrictedStatuses = ["pending", "suspended", "blocked", "disabled"];
//   const isRestricted = restrictedStatuses.includes(incomeStatus);

//   // When income mode is disabled, show activation modal instead of restriction modal
//   const isDisabled = incomeStatus === "disabled";

//   const handleIncomeModeActivation = () => {
//     setActivationModalOpen(true);
//   };

//   return (
//     <>
//       {/* Balance summary — coins and taka */}
//       <BalanceSummary
//         initialCoins={wallet.coins}
//         initialTakaBalance={wallet.taka_balance ?? 0}
//         totalEarnedToday={todayEarned}
//         totalTakaWithdrawn={wallet.total_taka_withdrawn ?? 0}
//       />

//       {/* Coin → Taka conversion */}
//       <ConversionCard
//         initialCoins={wallet.coins}
//         initialTakaBalance={wallet.taka_balance ?? 0}
//         conversionInfo={{
//           minCoins: minConversionCoins,
//           coinsPerTaka,
//         }}
//         onIncomeModeDisabled={handleIncomeModeActivation}
//       />

//       {/* Taka withdrawal (only available when balance >= min) */}
//       <TakaWithdrawalCard
//         minAmount={minTakaWithdrawal}
//         takaBalance={wallet.taka_balance ?? 0}
//         initialWithdrawals={transactions}
//       />

//       <section>
//         <div className="flex items-center justify-between">
//           <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
//             <History className="size-5 text-gold-dark" /> Recent transactions
//           </h2>
//           <Link href="/dashboard/transactions" className="btn btn-ghost btn-sm">
//             View all <ArrowRight className="size-4" />
//           </Link>
//         </div>

//         <div className="mt-4">
//           {transactions.length === 0 ? (
//             <EmptyState
//               icon={Coins}
//               title="No transactions yet"
//               description="Play a game, scratch a card or claim your daily reward — everything shows up here."
//               action={
//                 <Link href="/dashboard/games" className="btn btn-primary btn-sm">
//                   Play your first game
//                 </Link>
//               }
//             )
//           ) : (
//             <div className="card bg-base-100 border border-base-300 shadow-card divide-y divide-base-200">
//               {transactions.map((tx) => {
//                 const meta = TRANSACTION_TYPES[tx.type] || {};
//                 return (
//                   <div key={tx.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
//                     <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-base-200 text-muted">
//                       <GameIcon name={meta.icon || "Coins"} className="size-5" />
//                     </span>
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-sm font-semibold text-plum">
//                         {tx.description || meta.label || tx.type}
//                       </p>
//                       <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
//                     </div>
//                     <span
//                       className={`font-extrabold shrink-0 ${
//                         tx.amount > 0 ? "text-success" : "text-error"
//                       }`}
//                     >
//                       {tx.amount > 0 ? "+" : ""}
//                       {new Intl.NumberFormat("en-US").format(tx.amount)}
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </section>

//       <div className="rounded-box bg-base-200 p-5 text-sm text-muted flex items-start gap-3">
//         <Banknote className="size-5 text-secondary shrink-0 mt-0.5" />
//         <p>
//           <strong className="text-plum">Withdrawals:</strong> Taka withdrawal requests are reviewed
//           by an admin. Taka is deducted from your balance as soon as you submit, and the payout
//           is processed off-platform through your chosen method.
//         </p>
//       </div>

//       {/* Modals */}
//       {isDisabled ? (
//         <IncomeModeActivationModal
//           open={activationModalOpen}
//           onClose={() => setActivationModalOpen(false)}
//           userHasIncomeMode={incomeStatus}
//         />
//       ) : (
//         <IncomeModeRestrictionModal
//           open={restrictionModalOpen}
//           onClose={() => setRestrictionModalOpen(false)}
//           status={incomeStatus}
//         />
//       )}
//       {/* Trigger restriction notice banner inside the wallet if restricted */}
//       {isRestricted && !isDisabled && (
//         <div className="mt-4 rounded-field border px-4 py-3 text-sm bg-base-200/10 border-base-300">
//           <p className="font-bold text-muted">Income Mode restricted</p>
//           <p className="mt-0.5 text-xs text-muted">Withdrawals are unavailable.</p>
//         </div>
//       )}
//     </>
//   );
// }