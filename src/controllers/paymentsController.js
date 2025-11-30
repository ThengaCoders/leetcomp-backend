import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../services/prismaClient.js';
import { getLeetCodeTotalSolved } from '../utils/getLeetCodeTotalSolved.js';

export const createOrder= async (req, res) => {
    const razorpay=new Razorpay({
        key_id:process.env.RAZORPAY_KEY_ID,
        key_secret:process.env.RAZORPAY_KEY_SECRET
    })

    try{
        const { receipt="rcpt_"+Date.now(), roomId } = req.body;

        const room = await prisma.rooms.findUnique({ where: { id: roomId } });
        if (!room) {
            return res.status(404).json({ success: false, error: "Room not found" });
        }

        const amount = room.cost;
        const currency = "INR";

        if(amount == 0){
            return res.status(400).json({
                success:false,
                error:"Invalid data"
            })
        }
        const options = {
            amount: amount*100,
            currency,
            receipt,
            payment_capture: 1
        }
        const order =await razorpay.orders.create(options);
        console.log(order);
        await prisma.order.create({
        data: {
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: "created",
            userId: req.user.id,
            roomId: roomId
        },
        });
        
        res.status(200).json({
            success:true,
            order
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            error:error.message
        })
    }
}

export const verifyPayment= async (req, res) => {
    try{
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        console.log(req.body);
        
        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature!== razorpay_signature) {
            return  res.status(400).json({
                success:false,
                message:"Payment verification failed"
            })
        }
        await prisma.order.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "paid", razorpayPaymentId: razorpay_payment_id },
        });
        res.status(200).json({
            success:true,
            message:"Payment verified successfully"
        })
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:"server error"
        })
    }
}

export const webhookHandler = async (req, res) => {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      await prisma.$transaction(async (tx) => {

        const updatedOrder = await tx.order.update({
          where: { razorpayOrderId: payment.order_id },
          data: {
            status: "paid",
            razorpayPaymentId: payment.id
          }
        });

        if (!updatedOrder.userId || !updatedOrder.roomId) return;

        const user = await tx.user.findUnique({
          where: { id: updatedOrder.userId },
          select: { leetcode: true }
        });

        const initial_qn_count = await getLeetCodeTotalSolved(user.leetcode);

        await tx.roomUser.create({
          data: {
            user_id: updatedOrder.userId,
            room_id: updatedOrder.roomId,
            initial_qn_count,
            final_qn_count: 0
          }
        });

        const room = await tx.rooms.findUnique({
          where: { id: updatedOrder.roomId },
          select: { cost: true }
        });

        await tx.rooms.update({
          where: { id: updatedOrder.roomId },
          data: {
            participant_count: { increment: 1 },
            prizePool: { increment: room.cost }
          }
        });

      }); // end transaction
    }

    return res.status(200).send("Webhook Received");

  } catch (err) {
    console.log("Webhook error:", err);
    return res.status(500).send("Server error");
  }
};