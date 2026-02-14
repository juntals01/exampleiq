"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Clock, Users, Phone, Mail } from "lucide-react";

export interface BookingResult {
  serviceType: string;
  pickupDate: string;
  pickupTime: string;
  pickup: { address: string };
  dropoff: { address: string };
  distance?: string;
  duration?: string;
  contact: {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  passengers: number;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  result: BookingResult | null;
}

export function BookingModal({ open, onClose, result }: BookingModalProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <DialogTitle className="text-lg">Booking Submitted</DialogTitle>
          </div>
          <DialogDescription>
            Your ride has been submitted successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Service Type & Schedule */}
          <div className="rounded-md border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {result.serviceType === "one-way" ? "One-way Trip" : "Hourly"}
              </span>
              <span className="text-xs text-gray-500">
                {result.pickupDate} at {result.pickupTime}
              </span>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm text-gray-800">{result.pickup.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-navy mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Drop off</p>
                <p className="text-sm text-gray-800">
                  {result.dropoff.address}
                </p>
              </div>
            </div>
          </div>

          {/* Distance & Duration */}
          {(result.distance || result.duration) && (
            <div className="flex gap-4 rounded-md bg-gray-50 p-3">
              {result.distance && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {result.distance}
                  </span>
                </div>
              )}
              {result.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {result.duration}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-700">
                {result.contact.phone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-700">
                {result.contact.firstName} {result.contact.lastName} &mdash;{" "}
                {result.contact.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-700">
                {result.passengers} passenger{result.passengers !== 1 && "s"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-gold text-white hover:bg-gold-hover"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
