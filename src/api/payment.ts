import type { ApiResponse, PaymentMethod } from "@/types/business";
import { post } from "@/utils/request";

export interface PaymentPayload {
  orderId: string;
  method: PaymentMethod;
  amount: number;
}

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paidAt: string;
}

// TODO: MP-WEIXIN 迁移时把服务端 /payment/pay 替换为微信支付下单与拉起支付能力。
// 当前服务端返回模拟支付结果，未接入任何真实支付渠道。
export function mockPay(payload: PaymentPayload): Promise<ApiResponse<PaymentResult>> {
  return post<ApiResponse<PaymentResult>>("/payment/pay", payload);
}
