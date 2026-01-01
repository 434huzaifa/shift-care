"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  jobTitle: z.string().min(1, "Job title is required"),
  nationality: z.string().min(1, "Nationality is required"),
  nationalityFlag: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  locationFlag: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
  gender: z.enum(["MALE", "FEMALE"]),
  isFav: z.boolean(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface Country {
  name: {
    common: string;
    official: string;
  };
  flags: {
    svg: string;
    png: string;
  };
}

interface CreateStaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateStaffForm({
  open,
  onOpenChange,
  onSuccess,
}: CreateStaffFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openNationalityCombobox, setOpenNationalityCombobox] = useState(false);
  const [openLocationCombobox, setOpenLocationCombobox] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flags"
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          const sortedCountries = data.sort((a, b) =>
            a.name.common.localeCompare(b.name.common)
          );
          setCountries(sortedCountries);
        } else {
          console.error("Invalid countries data:", data);
          setCountries([]);
          toast.error("Failed to load countries");
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        setCountries([]);
        toast.error("Failed to load countries");
      } finally {
        setIsLoadingCountries(false);
      }
    };

    if (open) {
      fetchCountries();
    }
  }, [open]);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      jobTitle: "",
      nationality: "",
      nationalityFlag: "",
      location: "",
      locationFlag: "",
      status: "ACTIVE",
      gender: "MALE",
      isFav: false,
    } as StaffFormData,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        if (!response.ok) {
          throw new Error("Failed to create staff");
        }

        toast.success("Staff created successfully!");
        onOpenChange(false);
        onSuccess?.();
        form.reset();
      } catch (error) {
        toast.error("Failed to create staff");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Staff</SheetTitle>
          <SheetDescription>
            Add a new staff member to your team
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 py-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter staff name"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter email address"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="jobTitle">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g., English Teacher"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="nationality">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                {isLoadingCountries ? (
                  <div className="flex items-center gap-2 p-2">
                    <Spinner />
                    <span className="text-sm text-muted-foreground">
                      Loading countries...
                    </span>
                  </div>
                ) : (
                  <Popover open={openNationalityCombobox} onOpenChange={setOpenNationalityCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openNationalityCombobox}
                        className="w-full justify-between font-normal"
                      >
                        {field.state.value ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={countries.find((c) => c.name.common === field.state.value)?.flags.svg}
                              alt=""
                              className="h-4 w-6 object-cover rounded-sm"
                            />
                            <span>{field.state.value}</span>
                          </div>
                        ) : (
                          "Select nationality"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-100 p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((country, index) => (
                              <CommandItem
                                key={index}
                                value={country.name.common}
                                onSelect={(currentValue) => {
                                  field.handleChange(currentValue === field.state.value ? "" : currentValue);
                                  const selectedCountry = countries.find(
                                    (c) => c.name.common.toLowerCase() === currentValue.toLowerCase()
                                  );
                                  setSelectedCountry(selectedCountry || null);
                                  form.setFieldValue("nationalityFlag", selectedCountry?.flags.svg || "");
                                  setOpenNationalityCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === country.name.common
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <img
                                  src={country.flags.svg}
                                  alt=""
                                  className="h-4 w-6 object-cover rounded-sm mr-2"
                                />
                                {country.name.common}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="space-y-2">
                  {isLoadingCountries ? (
                    <div className="flex items-center gap-2 p-2">
                      <Spinner />
                      <span className="text-sm text-muted-foreground">
                        Loading countries...
                      </span>
                    </div>
                  ) : (
                    <Popover open={openLocationCombobox} onOpenChange={setOpenLocationCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openLocationCombobox}
                          className="w-full justify-between font-normal"
                        >
                          {selectedCountry ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={selectedCountry.flags.svg}
                                alt=""
                                className="h-4 w-6 object-cover rounded-sm"
                              />
                              <span>{selectedCountry.name.common}</span>
                            </div>
                          ) : (
                            "Select country"
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-100 p-0">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country, index) => (
                                <CommandItem
                                  key={index}
                                  value={country.name.common}
                                  onSelect={(currentValue) => {
                                    const selectedCountry = countries.find(
                                      (c) => c.name.common.toLowerCase() === currentValue.toLowerCase()
                                    );
                                    setSelectedCountry(selectedCountry || null);
                                    if (selectedCountry) {
                                      form.setFieldValue("locationFlag", selectedCountry.flags.svg);
                                      setCityInput("");
                                    }
                                    setOpenLocationCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCountry?.name.common === country.name.common
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <img
                                    src={country.flags.svg}
                                    alt=""
                                    className="h-4 w-6 object-cover rounded-sm mr-2"
                                  />
                                  {country.name.common}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Input
                    id="location-city"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                      if (selectedCountry) {
                        field.handleChange(
                          `${e.target.value}, ${selectedCountry.name.common}`
                        );
                      }
                    }}
                    onBlur={field.handleBlur}
                    placeholder="Enter city"
                    disabled={!selectedCountry}
                  />
                </div>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  value={field.state.value}
                  onChange={(e) => {
                    const value = e.target.value as "MALE" | "FEMALE";
                    field.handleChange(value);
                  }}
                  onBlur={field.handleBlur}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={field.state.value}
                  onChange={(e) => {
                    const value = e.target.value as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
                    field.handleChange(value);
                  }}
                  onBlur={field.handleBlur}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="isFav">
            {(field) => (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFav"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isFav" className="cursor-pointer">
                  Mark as favorite
                </Label>
              </div>
            )}
          </form.Field>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Staff"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
