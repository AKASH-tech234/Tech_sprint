// src/components/Dashboard/Official/PaymentHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  Shield,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { issueService } from "../../../services/issueService";

const statusBadge = {
  created: "bg-white/5 text-white/70 border-white/10",
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

export function PaymentHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await issueService.getFundingHistory({ limit: 50 });
      const data = resp?.data || resp;
      setTransactions(data?.transactions || []);
    } catch (err) {
      console.error("Failed to load funding history:", err);
      setError(err.message || "Failed to load funding history");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const rows = useMemo(() => {
    return (transactions || []).map((t) => {
      const issue = t.issue;
      const member = t.toMember;
      return {
        id: t._id,
        issueDbId: issue?._id || "",
        issueId: issue?.issueId || issue?._id || "-",
        issueTitle: issue?.title || "-",
        issueStatus: issue?.status || "-",
        memberName: member?.username || member?.email || "-",
        amount: typeof t.amount === "number" ? t.amount : Number(t.amount || 0),
        currency: t.currency || "INR",
        status: t.status || "created",
        createdAt: t.createdAt,
        paidAt: t.paidAt,
        razorpayOrderId: t.razorpayOrderId,
        razorpayPaymentId: t.razorpayPaymentId,
      };
    });
  }, [transactions]);

  const formatDateTime = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-rose-500" />
          <p className="text-white/60">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <p className="mb-2 text-rose-400">Failed to load payment history</p>
          <p className="mb-4 text-sm text-white/60">{error}</p>
          <button
            onClick={loadHistory}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment History</h1>
          <p className="text-sm text-white/60">
            Razorpay funding transactions for verified issues
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
            <Shield className="h-4 w-4 text-rose-400" />
          </div>
          <h2 className="font-semibold text-white">Transactions</h2>
          <span className="ml-auto text-xs text-white/40">{rows.length} total</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            No transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="px-6 py-3 font-medium">Issue</th>
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Paid</th>
                  <th className="px-6 py-3 font-medium">Razorpay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{r.issueId}</div>
                      <div className="text-xs text-white/50 line-clamp-1">{r.issueTitle}</div>
                      <div className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                        {r.issueStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/80">{r.memberName}</td>
                    <td className="px-6 py-4 text-white/80">
                      {Number.isFinite(r.amount) ? r.amount.toFixed(2) : r.amount} {r.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                          statusBadge[r.status] || statusBadge.created
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">{formatDateTime(r.createdAt)}</td>
                    <td className="px-6 py-4 text-white/60">{formatDateTime(r.paidAt)}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-white/60">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40">Order</span>
                          <span className="font-mono">{r.razorpayOrderId || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40">Payment</span>
                          <span className="font-mono">{r.razorpayPaymentId || "-"}</span>
                        </div>
                        {r.issueDbId && (
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/official/issue/${r.issueDbId}`)}
                              className="inline-flex items-center gap-1 text-white/60 hover:text-white"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View issue
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentHistory;
