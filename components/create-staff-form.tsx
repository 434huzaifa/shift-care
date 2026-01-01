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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { showSuccess, showError } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  jobTitle: z.string().min(1, "Job title is required"),
  nationality: z.string().min(1, "Nationality is required"),
  nationalityFlag: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  locationFlag: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
  gender: z.enum(["MALE", "FEMALE"]),
  isFav: z.boolean(),
  profileImage: z.string().optional(),
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
  staffData?: {
    id: number;
    name: string;
    email: string;
    jobTitle: string;
    nationality: string;
    nationalityFlag?: string | null;
    location: string;
    locationFlag?: string | null;
    status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
    gender: "MALE" | "FEMALE";
    isFav: boolean;
    profileImage?: string | null;
  } | null;
}

export function CreateStaffForm({
  open,
  onOpenChange,
  onSuccess,
  staffData,
}: CreateStaffFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openNationalityCombobox, setOpenNationalityCombobox] = useState(false);
  const [openLocationCombobox, setOpenLocationCombobox] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Function to resize image to 256x256
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Image must be less than 5MB"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, 256, 256);
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.9);
          resolve(resizedBase64);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedImage = await resizeImage(file);
      setImagePreview(resizedImage);
      form.setFieldValue("profileImage", resizedImage);
    } catch (error: unknown) {
      showError("Image upload failed", error instanceof Error ? error.message : "Unknown error");
      e.target.value = "";
    }
  };

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
          showError("Failed to load countries", "Please try again");
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        setCountries([]);
        showError("Failed to load countries", "Please refresh the page");
      } finally {
        setIsLoadingCountries(false);
      }
    };

    if (open) {
      fetchCountries();
    }
  }, [open]);

  // Parse location and set selected country for edit mode
  useEffect(() => {
    if (staffData && open && countries.length > 0) {
      const locationParts = staffData.location.split(", ");
      if (locationParts.length === 2) {
        // Location has city + country
        setCityInput(locationParts[0]);
        const countryName = locationParts[1];
        const country = countries.find(c => c.name.common === countryName);
        if (country) {
          setSelectedCountry(country);
        }
      } else if (locationParts.length === 1) {
        // Location is just country name
        setCityInput("");
        const countryName = locationParts[0];
        const country = countries.find(c => c.name.common === countryName);
        if (country) {
          setSelectedCountry(country);
        }
      }
      // Set image preview if profile image exists
      if (staffData.profileImage) {
        if (typeof staffData.profileImage === 'string') {
          setImagePreview(staffData.profileImage);
        } else if (typeof staffData.profileImage === 'object') {
          // Raw Buffer object with numeric keys
          const byteArray = Object.values(staffData.profileImage as Record<string, number>);
          const buffer = Buffer.from(byteArray);
          const base64 = buffer.toString('base64');
          setImagePreview(`data:image/jpeg;base64,${base64}`);
        }
      }
      
      // Update form values for edit mode
      form.setFieldValue("name", staffData.name);
      form.setFieldValue("email", staffData.email);
      form.setFieldValue("jobTitle", staffData.jobTitle);
      form.setFieldValue("nationality", staffData.nationality);
      form.setFieldValue("nationalityFlag", staffData.nationalityFlag || "");
      form.setFieldValue("location", staffData.location);
      form.setFieldValue("locationFlag", staffData.locationFlag || "");
      form.setFieldValue("status", staffData.status);
      form.setFieldValue("gender", staffData.gender);
      form.setFieldValue("isFav", staffData.isFav);
      
      if (staffData.profileImage) {
        if (typeof staffData.profileImage === 'string') {
          form.setFieldValue("profileImage", staffData.profileImage);
        } else if (typeof staffData.profileImage === 'object') {
          const byteArray = Object.values(staffData.profileImage as Record<string, number>);
          const buffer = Buffer.from(byteArray);
          form.setFieldValue("profileImage", buffer.toString('base64'));
        }
      }
    }
  }, [staffData, open, countries]);

  // Reset form and states when closing
  useEffect(() => {
    if (!open) {
      setCityInput("");
      setSelectedCountry(null);
      setImagePreview(null);
      if (!staffData) {
        form.reset();
      }
    }
  }, [open, staffData]);

  const form = useForm({
    defaultValues: staffData ? {
      name: staffData.name,
      email: staffData.email,
      jobTitle: staffData.jobTitle,
      nationality: staffData.nationality,
      nationalityFlag: staffData.nationalityFlag || "",
      location: staffData.location,
      locationFlag: staffData.locationFlag || "",
      status: staffData.status,
      gender: staffData.gender,
      isFav: staffData.isFav,
      profileImage: (() => {
        if (!staffData.profileImage) return "";
        if (typeof staffData.profileImage === 'string') {
          return staffData.profileImage;
        }
        if (typeof staffData.profileImage === 'object') {
          // Raw Buffer object with numeric keys
          const byteArray = Object.values(staffData.profileImage as Record<string, number>);
          const buffer = Buffer.from(byteArray);
          return buffer.toString('base64');
        }
        return "";
      })(),
    } : {
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
      profileImage: "",
    } as StaffFormData,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const url = staffData ? `/api/staff/${staffData.id}` : "/api/staff";
        const method = staffData ? "PUT" : "POST";
        
        console.log("Form submission body:", value);
        
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        if (!response.ok) {
          let errorMessage = staffData ? "Failed to update staff" : "Failed to create staff";
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If JSON parsing fails, use status text or default message
            errorMessage = response.statusText || errorMessage;
          }
          
          showError(errorMessage, "Please check the form and try again");
          return;
        }

        const result = await response.json();
        showSuccess(
          staffData ? "Staff updated successfully!" : "Staff created successfully!",
          staffData ? `${value.name}'s information has been updated` : `${value.name} has been added to the team`
        );
        onOpenChange(false);
        onSuccess?.();
        form.reset();
      } catch (error: unknown) {
        showError(
          "An unexpected error occurred",
          "Please check the form and try again"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleDelete = async () => {
    if (!staffData) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/staff/${staffData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete staff");
      }

      showSuccess("Staff deleted successfully!", `${staffData.name} has been removed from the system`);
      setShowDeleteAlert(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      showError("Failed to delete staff", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{staffData ? "Edit Staff" : "Create New Staff"}</SheetTitle>
          <SheetDescription>
            {staffData ? "Update staff member information" : "Add a new staff member to your team"}
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

          {/* Profile Image Upload */}
          <form.Field name="profileImage">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="profileImage">Profile Image</Label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null);
                          field.handleChange("");
                          const fileInput = document.getElementById("profileImage") as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 5MB. Image will be resized to 256x256px
                    </p>
                    {staffData && !imagePreview && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        No profile image set
                      </p>
                    )}
                  </div>
                </div>
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
                                  const selectedCountry = countries.find(
                                    (c) => c.name.common.toLowerCase() === currentValue.toLowerCase()
                                  );
                                  if (selectedCountry) {
                                    field.handleChange(selectedCountry.name.common);
                                    form.setFieldValue("nationalityFlag", selectedCountry.flags.svg);
                                  }
                                  setOpenNationalityCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value?.toLowerCase() === country.name.common.toLowerCase()
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
                                      // Set location to just country name when city is empty
                                      const location = cityInput.trim()
                                        ? `${cityInput.trim()}, ${selectedCountry.name.common}`
                                        : selectedCountry.name.common;
                                      field.handleChange(location);
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
                        const location = e.target.value.trim()
                          ? `${e.target.value.trim()}, ${selectedCountry.name.common}`
                          : selectedCountry.name.common;
                        field.handleChange(location);
                      }
                    }}
                    onBlur={field.handleBlur}
                    placeholder="Enter city (optional)"
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
            <div className="flex w-full gap-2">
              {staffData && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className={!staffData ? "ml-auto" : ""}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    {staffData ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  staffData ? "Update Staff" : "Create Staff"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {staffData?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
