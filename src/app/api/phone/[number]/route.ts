import { NextRequest, NextResponse } from "next/server";
import { findContactByPhone } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const phone = decodeURIComponent(number);

    if (!phone || phone.trim().length < 7) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const contact = findContactByPhone(phone);

    if (contact) {
      return NextResponse.json({
        found: true,
        contact: {
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
        },
      });
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error("Phone lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
