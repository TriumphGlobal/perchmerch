import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface EarningsSummary {
  totalEarnings: number;
  availableForPayout: number;
  pendingEarnings: number;
  lastPayout: {
    amount: number;
    date: string;
  } | null;
}

interface EarningsBreakdown {
  brandEarnings: {
    brandId: string;
    brandName: string;
    amount: number;
    share: number;
  }[];
  referralEarnings: {
    userId: string;
    userName: string;
    amount: number;
    commission: number;
  }[];
  affiliateEarnings: {
    brandId: string;
    brandName: string;
    amount: number;
    commission: number;
  }[];
}

export default function EarningsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    availableForPayout: 0,
    pendingEarnings: 0,
    lastPayout: null,
  });
  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    brandEarnings: [],
    referralEarnings: [],
    affiliateEarnings: [],
  });
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    // Check for Stripe Connect onboarding status
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error) {
      toast.error("Failed to complete Stripe Connect onboarding");
    } else if (success) {
      toast.success("Successfully connected Stripe account");
      // Refresh earnings data
      fetchEarnings();
    }
  }, [searchParams]);

  const fetchEarnings = async () => {
    try {
      const response = await fetch("/api/earnings");
      if (!response.ok) {
        throw new Error("Failed to fetch earnings");
      }
      const data = await response.json();
      setSummary(data.summary);
      setBreakdown(data.breakdown);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const handleRequestPayout = async () => {
    try {
      const response = await fetch("/api/payouts/request", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400 && data.needsConnect) {
          await handleConnectStripe();
          return;
        }
        throw new Error(data.message || "Failed to request payout");
      }

      toast.success("Payout request submitted successfully");
    } catch (error) {
      console.error("Error requesting payout:", error);
      toast.error("Failed to request payout");
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnectLoading(true);
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create Stripe Connect account");
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error("Failed to connect Stripe account");
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Earnings Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-2xl font-bold">${summary.totalEarnings.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Available for Payout</p>
          <p className="text-2xl font-bold">${summary.availableForPayout.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Earnings</p>
          <p className="text-2xl font-bold">${summary.pendingEarnings.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Last Payout</p>
          <p className="text-2xl font-bold">
            {summary.lastPayout
              ? `$${summary.lastPayout.amount.toFixed(2)}`
              : "No payouts yet"}
          </p>
          {summary.lastPayout && (
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date(summary.lastPayout.date))}
            </p>
          )}
        </Card>
      </div>

      {summary.availableForPayout > 0 && (
        <div className="mb-8">
          <Button
            onClick={handleRequestPayout}
            disabled={connectLoading}
          >
            {connectLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting to Stripe...
              </div>
            ) : (
              `Request Payout ($${summary.availableForPayout.toFixed(2)})`
            )}
          </Button>
        </div>
      )}

      <Tabs defaultValue="brands" className="w-full">
        <TabsList>
          <TabsTrigger value="brands">Brand Earnings</TabsTrigger>
          <TabsTrigger value="referrals">Referral Earnings</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Share</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.brandEarnings.length > 0 ? (
                breakdown.brandEarnings.map((earning) => (
                  <TableRow key={earning.brandId}>
                    <TableCell>{earning.brandName}</TableCell>
                    <TableCell>{earning.share}%</TableCell>
                    <TableCell className="text-right">
                      ${earning.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>No brand earnings yet</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="referrals">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred User</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.referralEarnings.length > 0 ? (
                breakdown.referralEarnings.map((earning) => (
                  <TableRow key={earning.userId}>
                    <TableCell>{earning.userName}</TableCell>
                    <TableCell>{earning.commission}%</TableCell>
                    <TableCell className="text-right">
                      ${earning.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>No referral earnings yet</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="affiliates">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.affiliateEarnings.length > 0 ? (
                breakdown.affiliateEarnings.map((earning) => (
                  <TableRow key={earning.brandId}>
                    <TableCell>{earning.brandName}</TableCell>
                    <TableCell>{earning.commission}%</TableCell>
                    <TableCell className="text-right">
                      ${earning.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>No affiliate earnings yet</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
} 