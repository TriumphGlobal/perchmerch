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
    // Add more mock orders as needed
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
    // Add more mock affiliates as needed
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
    // Add more daily stats as needed
  ],
}

export default function AffiliatePage() {
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