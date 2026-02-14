import { z } from "zod";

const locationSchema = z.object({
  address: z.string().min(1, "Location is required"),
  lat: z.number(),
  lng: z.number(),
});

export type LocationValue = z.infer<typeof locationSchema>;

// Accepts: +17744153244, +1 774 415 3244, 774-415-3244, (774) 415-3244, etc.
const phoneRegex = /^[\d\s\-().+]{7,}$/;

export const bookingSchema = z
  .object({
    serviceType: z.enum(["one-way", "hourly"]),
    pickupDate: z.string().min(1, "Pickup date is required"),
    pickupTime: z.string().min(1, "Pickup time is required"),
    pickupLocationType: z.enum(["location", "airport"]),
    pickupLocation: locationSchema,
    stops: z.array(z.string()),
    dropoffLocationType: z.enum(["location", "airport"]),
    dropoffLocation: locationSchema,
    phone: z.string().optional(),
    phoneRecognized: z.boolean(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    passengers: z.number().min(1, "At least 1 passenger required"),
  })
  .superRefine((data, ctx) => {
    // Validate pickup date is not in the past
    if (data.pickupDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pickup = new Date(data.pickupDate + "T00:00:00");
      if (pickup < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pickup date cannot be in the past",
          path: ["pickupDate"],
        });
      }
    }

    const hasPhone = data.phone && data.phone.trim().length > 0;
    const hasName =
      data.firstName &&
      data.firstName.trim().length > 0 &&
      data.lastName &&
      data.lastName.trim().length > 0;
    const hasEmail = data.email && data.email.trim().length > 0;
    const hasContactInfo = hasName && hasEmail;

    // Either phone or full contact info is required
    if (!hasPhone && !hasContactInfo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required",
        path: ["phone"],
      });
    }

    // If phone is provided, validate format
    if (hasPhone && !phoneRegex.test(data.phone!)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number",
        path: ["phone"],
      });
    }

    // When phone is NOT recognized, require contact info
    if (!data.phoneRecognized) {
      if (!data.firstName || data.firstName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "First name is required for new customers",
          path: ["firstName"],
        });
      }
      if (!data.lastName || data.lastName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Last name is required for new customers",
          path: ["lastName"],
        });
      }
      if (!data.email || data.email.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email is required for new customers",
          path: ["email"],
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid email address",
          path: ["email"],
        });
      }
    }
  });

export type BookingFormValues = z.infer<typeof bookingSchema>;
