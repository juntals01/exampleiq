import { NextRequest, NextResponse } from "next/server";
import { upsertContact } from "@/lib/db";

interface BookingPayload {
  serviceType: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocationType: string;
  pickupLocation: { address: string; lat: number; lng: number };
  stops: string[];
  dropoffLocationType: string;
  dropoffLocation: { address: string; lat: number; lng: number };
  phone: string;
  phoneRecognized: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  passengers: number;
  distance?: string;
  duration?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingPayload = await request.json();

    // Save / update the contact
    const firstName = body.firstName || "";
    const lastName = body.lastName || "";
    const email = body.email || "";

    if (firstName && lastName && email) {
      upsertContact(body.phone, firstName, lastName, email);
    }

    // Build confirmation response
    const confirmation = {
      id: `BK-${Date.now()}`,
      status: "confirmed",
      serviceType: body.serviceType,
      pickupDate: body.pickupDate,
      pickupTime: body.pickupTime,
      pickup: body.pickupLocation,
      dropoff: body.dropoffLocation,
      stops: body.stops,
      distance: body.distance || null,
      duration: body.duration || null,
      contact: {
        phone: body.phone,
        firstName,
        lastName,
        email,
      },
      passengers: body.passengers,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(confirmation, { status: 201 });
  } catch (error) {
    console.error("Booking submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
