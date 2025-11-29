import { prisma } from "../services/prismaClient.js";


export const getPayouts = async (req, res) => {
  try {
    const status = req.query.status;

    const payouts = await prisma.payout.findMany({
      where: { status },
      orderBy: { createdAt: "desc" }
    });

    res.json(payouts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * GET /api/payouts/:id
 */
export const getSinglePayout = async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await prisma.payout.findUnique({
      where: { id }
    });

    if (!payout)
      return res.status(404).json({ message: "Payout not found" });

    res.json(payout);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * PATCH /api/payouts/:id/mark-paid
 * Body: { utr: "123456789012" }
 */
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { utr } = req.body;

    // Validate UTR
    if (!/^\d{12}$/.test(utr)) {
      return res.status(400).json({ message: "Invalid UTR. Must be 12 digits." });
    }

    const updated = await prisma.payout.update({
      where: { id },
      data: {
        utr,
        status: "Paid",
      }
    });

    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

