// Mock escrow data for dashboard UI
export const escrowData = {
  totalEscrow: "$14,800",
  activeEscrow: "$11,300",
  pendingRelease: "$2,500",
  completedEscrow: "$1,000",
  monthlyStats: {
    deposited: "$8,500",
    released: "$6,200",
    pending: "$2,300"
  },
  transactions: [
    {
      id: 1,
      projectId: 1,
      projectName: "Website Redesign",
      amount: "$2000",
      type: "deposit",
      status: "completed",
      date: "2024-03-10"
    },
    {
      id: 2,
      projectId: 2,
      projectName: "Mobile App UI",
      amount: "$3500",
      type: "deposit",
      status: "completed",
      date: "2024-03-12"
    },
    {
      id: 3,
      projectId: 3,
      projectName: "E-commerce Platform",
      amount: "$5000",
      type: "deposit",
      status: "completed",
      date: "2024-03-08"
    },
    {
      id: 4,
      projectId: 4,
      projectName: "Dashboard Analytics",
      amount: "$1500",
      type: "release",
      status: "completed",
      date: "2024-03-14"
    }
  ]
};

// Export as mockEscrow for compatibility
export const mockEscrow = escrowData;
