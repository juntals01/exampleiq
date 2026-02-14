"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "@/lib/google-maps-provider";

export interface PlaceValue {
  address: string;
  lat: number;
  lng: number;
}

interface PlacesAutocompleteProps {
  label: string;
  value: PlaceValue;
  onChange: (place: PlaceValue) => void;
  placeholder?: string;
}

export function PlacesAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Search location...",
}: PlacesAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState(value.address);

  // Sync external value changes to the input
  useEffect(() => {
    setInputValue(value.address);
  }, [value.address]);

  const onLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      autocompleteRef.current = autocomplete;
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const newValue: PlaceValue = {
        address: place.formatted_address || place.name || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setInputValue(newValue.address);
      onChange(newValue);
    }
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear the lat/lng when user edits manually (force re-selection)
    if (value.lat !== 0 || value.lng !== 0) {
      onChange({ address: e.target.value, lat: 0, lng: 0 });
    }
  };

  if (!isLoaded) {
    return (
      <div className="relative">
        <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 z-10">
          {label}
        </label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <span className="pl-3 text-gold flex-shrink-0">
            <MapPin className="h-4 w-4" />
          </span>
          <input
            className="flex-1 bg-transparent py-3 pl-2 pr-3 text-sm text-gray-700 outline-none"
            placeholder="Loading maps..."
            disabled
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 z-10">
        {label}
      </label>
      <div className="flex items-center border border-gray-300 rounded-md">
        <span className="pl-3 text-gold flex-shrink-0">
          <MapPin className="h-4 w-4" />
        </span>
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{ componentRestrictions: { country: "us" } }}
          className="flex-1"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full bg-transparent py-3 pl-2 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </Autocomplete>
      </div>
    </div>
  );
}
