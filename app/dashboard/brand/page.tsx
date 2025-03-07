"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { BrandDashboard } from "@/components/dashboard/brand-dashboard"

// Mock data for the brand dashboard
const mockBrandData = {
  brand: {
    id: "brand_1",
    name: "Example Brand",
    totalSales: 15000,
    totalEarnings: 7500, // 50% of total sales
  },
  recentOrders: [
    {
      id: "order_1",
      createdAt: new Date().toISOString(),
      totalAmount: 100,
      brandEarnings: 50,
      affiliateId: "aff_1",
      affiliateDue: 10,
    },
    {
      id: "order_2",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      totalAmount: 150,
      brandEarnings: 75,
      affiliateId: "aff_2",
      affiliateDue: 15,
    },
    {
      id: "order_3",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      totalAmount: 200,
      brandEarnings: 100,
    },
  ],
  affiliates: [
    {
      id: "aff_1",
      user: {
        name: "John Doe",
        email: "john@example.com",
      },
      commissionRate: 0.2, // 20% of brand's profit
      totalSales: 5000,
      totalDue: 500,
      clickCount: 100,
    },
    {
      id: "aff_2",
      user: {
        name: "Jane Smith",
        email: "jane@example.com",
      },
      commissionRate: 0.25, // 25% of brand's profit
      totalSales: 3000,
      totalDue: 375,
      clickCount: 80,
    },
  ],
  dailyStats: [
    {
      date: "2024-03-01",
      sales: 1000,
      earnings: 500,
      affiliateSales: 300,
    },
    {
      date: "2024-03-02",
      sales: 1200,
      earnings: 600,
      affiliateSales: 400,
    },
    {
      date: "2024-03-03",
      sales: 800,
      earnings: 400,
      affiliateSales: 200,
    },
    {
      date: "2024-03-04",
      sales: 1500,
      earnings: 750,
      affiliateSales: 600,
    },
    {
      date: "2024-03-05",
      sales: 1100,
      earnings: 550,
      affiliateSales: 350,
    },
    {
      date: "2024-03-06",
      sales: 1300,
      earnings: 650,
      affiliateSales: 450,
    },
    {
      date: "2024-03-07",
      sales: 1400,
      earnings: 700,
      affiliateSales: 500,
    },
  ],
}

export default function BrandPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Brand Dashboard"
        text="View your brand's performance and manage affiliates."
      />
      <BrandDashboard {...mockBrandData} />
    </DashboardShell>
  )
} 