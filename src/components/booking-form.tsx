"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingFormValues } from "@/schemas/booking";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Gauge,
  Calendar,
  Clock,
  Plus,
  User,
  Mail,
  Hash,
  Timer,
  Loader2,
  Car,
  MapPin as MapPinIcon,
} from "lucide-react";
import { api } from "@/lib/axios";
import { GoogleMapsProvider, useGoogleMaps } from "@/lib/google-maps-provider";
import { PlacesAutocomplete, type PlaceValue } from "./places-autocomplete";
import { BookingModal, type BookingResult } from "./booking-modal";

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function LocationTypeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: "location" | "airport") => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("location")}
        className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
          value === "location"
            ? "border-gold text-gold"
            : "border-gray-300 text-gray-400"
        }`}
      >
        Location
      </button>
      <button
        type="button"
        onClick={() => onChange("airport")}
        className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
          value === "airport"
            ? "border-gold text-gold"
            : "border-gray-300 text-gray-400"
        }`}
      >
        Airport
      </button>
    </div>
  );
}

function FloatingInput({
  label,
  icon,
  placeholder,
  value,
  onChange,
  onBlur,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  type?: string;
}) {
  return (
    <div className="relative">
      <label className="absolute -top-2.5 left-8 bg-white px-1 text-xs text-gray-500 z-10">
        {label}
      </label>
      <div className="flex items-center border border-gray-300 rounded-md">
        <span className="pl-3 text-gray-400 flex-shrink-0">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="flex-1 bg-transparent py-3 pl-2 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Distance Matrix helper
   ──────────────────────────────────────────── */

interface TravelInfo {
  distance: string;
  duration: string;
}

function useDistanceMatrix(
  pickup: PlaceValue,
  dropoff: PlaceValue
): TravelInfo | null {
  const { isLoaded } = useGoogleMaps();
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);

  useEffect(() => {
    if (
      !isLoaded ||
      pickup.lat === 0 ||
      pickup.lng === 0 ||
      dropoff.lat === 0 ||
      dropoff.lng === 0
    ) {
      setTravelInfo(null);
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [{ lat: pickup.lat, lng: pickup.lng }],
        destinations: [{ lat: dropoff.lat, lng: dropoff.lng }],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (
          status === "OK" &&
          response?.rows[0]?.elements[0]?.status === "OK"
        ) {
          const el = response.rows[0].elements[0];
          setTravelInfo({
            distance: el.distance.text,
            duration: el.duration.text,
          });
        } else {
          setTravelInfo(null);
        }
      }
    );
  }, [isLoaded, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  return travelInfo;
}

/* ────────────────────────────────────────────
   Phone lookup helper
   ──────────────────────────────────────────── */

type PhoneStatus = "idle" | "checking" | "recognized" | "new";

interface RecognizedContact {
  firstName: string;
  lastName: string;
  email: string;
}

/* ────────────────────────────────────────────
   Main Form
   ──────────────────────────────────────────── */

export function BookingForm() {
  return (
    <GoogleMapsProvider>
      <BookingFormInner />
    </GoogleMapsProvider>
  );
}

function BookingFormInner() {
  const [stops, setStops] = useState<PlaceValue[]>([]);
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");
  const [recognizedContact, setRecognizedContact] =
    useState<RecognizedContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceType: "one-way",
      pickupDate: "",
      pickupTime: "",
      pickupLocationType: "location",
      pickupLocation: { address: "", lat: 0, lng: 0 },
      stops: [],
      dropoffLocationType: "airport",
      dropoffLocation: { address: "", lat: 0, lng: 0 },
      phone: "",
      phoneRecognized: false,
      firstName: "",
      lastName: "",
      email: "",
      passengers: 1,
    },
  });

  const serviceType = form.watch("serviceType");
  const pickupLocation = form.watch("pickupLocation");
  const dropoffLocation = form.watch("dropoffLocation");

  // Distance Matrix
  const travelInfo = useDistanceMatrix(pickupLocation, dropoffLocation);

  /* ── Phone lookup on blur ── */
  const lookupPhone = useCallback(
    async (phone: string) => {
      const cleaned = phone.replace(/[\s\-().]/g, "");
      if (cleaned.length < 7) {
        setPhoneStatus("idle");
        return;
      }

      setPhoneStatus("checking");
      try {
        const { data } = await api.get(
          `/phone/${encodeURIComponent(phone)}`
        );
        if (data.found) {
          setPhoneStatus("recognized");
          setRecognizedContact(data.contact);
          form.setValue("phoneRecognized", true);
          form.setValue("firstName", data.contact.firstName);
          form.setValue("lastName", data.contact.lastName);
          form.setValue("email", data.contact.email);
        } else {
          setPhoneStatus("new");
          setRecognizedContact(null);
          form.setValue("phoneRecognized", false);
        }
      } catch {
        setPhoneStatus("new");
        setRecognizedContact(null);
        form.setValue("phoneRecognized", false);
      }
    },
    [form]
  );

  /* ── Submit ── */
  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        stops: stops
          .filter((s) => s.address.length > 0)
          .map((s) => s.address),
        distance: travelInfo?.distance,
        duration: travelInfo?.duration,
      };
      const { data: result } = await api.post("/bookings", payload);
      setBookingResult({
        serviceType: result.serviceType,
        pickupDate: result.pickupDate,
        pickupTime: result.pickupTime,
        pickup: result.pickup,
        dropoff: result.dropoff,
        distance: result.distance || travelInfo?.distance,
        duration: result.duration || travelInfo?.duration,
        contact: result.contact,
        passengers: result.passengers,
      });
      setModalOpen(true);
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show contact fields when: phone not yet checked (idle) or explicitly new
  const showContactFields = phoneStatus !== "recognized";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-[560px] md:max-w-[600px] lg:max-w-[640px]">
        {/* ── Logo ── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Gauge className="h-8 w-8 text-navy" strokeWidth={2.2} />
          <span className="text-2xl font-bold text-navy tracking-tight">
            ExampleIQ
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="font-serif text-2xl sm:text-[1.7rem] leading-snug italic text-navy mb-6">
          Let&apos;s get you on your way!
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            {/* ═══════════════════════════
                Service Type Toggle
            ═══════════════════════════ */}
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => field.onChange("one-way")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                          serviceType === "one-way"
                            ? "bg-gold text-white"
                            : "bg-white text-gray-400"
                        }`}
                      >
                        <span
                          className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                            serviceType === "one-way"
                              ? "border-white"
                              : "border-gray-400"
                          }`}
                        >
                          {serviceType === "one-way" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        One-way
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("hourly")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                          serviceType === "hourly"
                            ? "bg-gold text-white"
                            : "bg-white text-gray-400"
                        }`}
                      >
                        <Timer
                          className="h-4 w-4"
                          strokeWidth={serviceType === "hourly" ? 2.5 : 2}
                        />
                        Hourly
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ═══════════════════════════
                Pickup Section
            ═══════════════════════════ */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800">Pickup</h2>

              {/* Date & Time — stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-3">
                <FormField
                  control={form.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="flex items-center border border-gray-300 rounded-md px-3 py-2.5 gap-2 focus-within:border-gold transition-colors">
                          <Calendar className="h-4 w-4 text-gold flex-shrink-0" />
                          <input
                            type="date"
                            {...field}
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupTime"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="flex items-center border border-gray-300 rounded-md px-3 py-2.5 gap-2 focus-within:border-gold transition-colors">
                          <Clock className="h-4 w-4 text-gold flex-shrink-0" />
                          <input
                            type="time"
                            {...field}
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location / Airport Toggle */}
              <FormField
                control={form.control}
                name="pickupLocationType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LocationTypeToggle
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Pickup Location — Google Places */}
              <FormField
                control={form.control}
                name="pickupLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PlacesAutocomplete
                        label="Location"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search pickup location..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Stops */}
              {stops.map((stop, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <PlacesAutocomplete
                      label={`Stop ${index + 1}`}
                      value={stop}
                      onChange={(place) => {
                        const newStops = [...stops];
                        newStops[index] = place;
                        setStops(newStops);
                      }}
                      placeholder="Search stop location..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setStops(stops.filter((_, i) => i !== index))
                    }
                    className="mt-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* + Add a stop */}
              <button
                type="button"
                onClick={() =>
                  setStops([...stops, { address: "", lat: 0, lng: 0 }])
                }
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add a stop
              </button>
            </div>

            {/* Separator */}
            <hr className="border-gray-200" />

            {/* ═══════════════════════════
                Drop Off Section
            ═══════════════════════════ */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800">Drop off</h2>

              <FormField
                control={form.control}
                name="dropoffLocationType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LocationTypeToggle
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dropoffLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PlacesAutocomplete
                        label="Location"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search drop off location..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ═══════════════════════════
                Travel Info Summary
            ═══════════════════════════ */}
            {travelInfo && (
              <div className="flex items-center gap-4 rounded-lg border border-gold/30 bg-gold/5 p-4">
                <Car className="h-5 w-5 text-gold flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-sm">
                  <span className="text-gray-700">
                    <strong className="text-gray-900">
                      {travelInfo.distance}
                    </strong>{" "}
                    distance
                  </span>
                  <span className="text-gray-700">
                    <strong className="text-gray-900">
                      {travelInfo.duration}
                    </strong>{" "}
                    estimated travel time
                  </span>
                </div>
              </div>
            )}

            {/* Separator */}
            <hr className="border-gray-200" />

            {/* ═══════════════════════════
                Contact Information
            ═══════════════════════════ */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800">
                Contact Information
              </h2>

              {/* Phone Input */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:border-gold transition-colors">
                        <div className="flex items-center px-3 py-3 border-r border-gray-200">
                          <span className="text-base leading-none">🇺🇸</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="+1 000 000 0000"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            // Reset phone status when user edits the number
                            if (
                              phoneStatus === "recognized" ||
                              phoneStatus === "new"
                            ) {
                              setPhoneStatus("idle");
                              setRecognizedContact(null);
                              form.setValue("phoneRecognized", false);
                            }
                          }}
                          onBlur={() => {
                            field.onBlur();
                            lookupPhone(field.value ?? "");
                          }}
                          className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                        />
                        {phoneStatus === "checking" && (
                          <Loader2 className="h-4 w-4 text-gold mr-3 animate-spin" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone status messages */}
              {phoneStatus === "recognized" && recognizedContact && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-sm text-green-800 font-medium">
                    Welcome back, {recognizedContact.firstName}! 👋
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {recognizedContact.email}
                  </p>
                </div>
              )}

              {phoneStatus === "idle" && (
                <p className="text-xs text-gray-400">
                  Enter your phone number to check if you&apos;re already in our
                  system, or fill in your details below.
                </p>
              )}

              {phoneStatus === "new" && (
                <p className="text-sm text-gray-600">
                  We don&apos;t have that phone number on file. Please provide
                  additional contact information.
                </p>
              )}

              {/* Contact fields — hidden only when phone is recognized */}
              {showContactFields && (
                <>
                  {/* First & Last Name — stacked on mobile */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <FloatingInput
                              label="First name"
                              icon={<User className="h-4 w-4" />}
                              placeholder="First name"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <FloatingInput
                              label="Last name"
                              icon={<User className="h-4 w-4" />}
                              placeholder="Last name"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingInput
                            label="Email"
                            icon={<Mail className="h-4 w-4" />}
                            placeholder="name@example.com"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Passengers */}
              <p className="text-sm text-gray-700 font-medium">
                How many passengers are expected for the trip?
              </p>

              <FormField
                control={form.control}
                name="passengers"
                render={({ field }) => (
                  <FormItem className="max-w-[140px]">
                    <FormControl>
                      <FloatingInput
                        label="# Passengers"
                        icon={<Hash className="h-4 w-4" />}
                        placeholder="#"
                        value={
                          field.value !== undefined ? String(field.value) : ""
                        }
                        onChange={(val) =>
                          field.onChange(val === "" ? undefined : Number(val))
                        }
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ═══════════════════════════
                Continue Button
            ═══════════════════════════ */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold text-white py-3.5 rounded-md font-semibold text-base hover:bg-gold-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Submitting..." : "Continue"}
            </button>
          </form>
        </Form>
      </div>

      {/* ── Result Modal ── */}
      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        result={bookingResult}
      />
    </div>
  );
}
