// app/api/payments/validate-phone/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, provider } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (provider === "mtn_momo") {
      const mtnService = createMTNMoMoService();
      const result = await mtnService.validateAccountHolder(phoneNumber);

      return NextResponse.json(
        {
          isValid: result.isValid,
          accountHolderName: result.accountHolderName,
        },
        { status: 200 }
      );
    }

    // For other providers or if validation not available
    return NextResponse.json(
      {
        isValid: true, // Assume valid
        message: "Validation not available for this provider",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Phone validation error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
