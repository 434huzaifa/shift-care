"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "react-select";
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
import { useState, useEffect } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import countriesData from "@/countries.json";

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
  name: string;
  flag: string;
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
    if (open) {
      // Load countries from local JSON and sort alphabetically
      const sortedCountries = [...countriesData].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCountries(sortedCountries);
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
        const country = countries.find(c => c.name === countryName);
        if (country) {
          setSelectedCountry(country);
        }
      } else if (locationParts.length === 1) {
        // Location is just country name
        setCityInput("");
        const countryName = locationParts[0];
        const country = countries.find(c => c.name === countryName);
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
      <SheetContent className="overflow-y-auto p-4">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl">{staffData ? "Edit Staff" : "Create New Staff"}</SheetTitle>
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
          className="space-y-6 py-2"
        >
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h3>
            
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter full name"
                    className="h-11"
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
                  <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                    {imagePreview && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-sm">
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
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact Information</h3>
            
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter email address"
                    className="h-11"
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Employment Information</h3>
            
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
                    className="h-11"
                  />
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
                <Label htmlFor="status">Employment Status *</Label>
                <Select
                  id="status"
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "ON_LEAVE", label: "On Leave" },
                    { value: "TERMINATED", label: "Terminated" },
                  ]}
                  value={
                    field.state.value
                      ? {
                          value: field.state.value,
                          label:
                            field.state.value === "ACTIVE"
                              ? "Active"
                              : field.state.value === "INACTIVE"
                              ? "Inactive"
                              : field.state.value === "ON_LEAVE"
                              ? "On Leave"
                              : "Terminated",
                        }
                      : null
                  }
                  onChange={(option) =>
                    field.handleChange(
                      option?.value as StaffFormData["status"]
                    )
                  }
                  placeholder="Select status"
                  classNamePrefix="select"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          </div>

          {/* Location & Nationality Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location & Nationality</h3>

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
                  <Select
                    id="nationality"
                    options={countries.map((country) => ({
                      value: country.name,
                      label: country.name,
                      flag: country.flag,
                    }))}
                    value={field.state.value ? {
                      value: field.state.value,
                      label: field.state.value,
                      flag: countries.find(c => c.name === field.state.value)?.flag
                    } : null}
                    onChange={(option) => {
                      if (option) {
                        field.handleChange(option.value);
                        form.setFieldValue("nationalityFlag", option.flag);
                      }
                    }}
                    formatOptionLabel={(option: any) => (
                      <div className="flex items-center gap-2">
                        <img
                          src={option.flag}
                          alt=""
                          style={{ height: '16px', width: '24px', objectFit: 'cover', borderRadius: '2px' }}
                        />
                        <span>{option.label}</span>
                      </div>
                    )}
                    placeholder="Select nationality"
                    isClearable
                    classNamePrefix="select"
                  />
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
                    <Select
                      id="location"
                      options={countries.map((country) => ({
                        value: country.name,
                        label: country.name,
                        flag: country.flag,
                      }))}
                      value={selectedCountry ? {
                        value: selectedCountry.name,
                        label: selectedCountry.name,
                        flag: selectedCountry.flag
                      } : null}
                      onChange={(option) => {
                        const selected = option ? countries.find(c => c.name === option.value) : null;
                        setSelectedCountry(selected || null);
                        if (selected) {
                          form.setFieldValue("locationFlag", selected.flag);
                          const location = cityInput.trim()
                            ? `${cityInput.trim()}, ${selected.name}`
                            : selected.name;
                          field.handleChange(location);
                        } else {
                          field.handleChange("");
                          setCityInput("");
                        }
                      }}
                      formatOptionLabel={(option: any) => (
                        <div className="flex items-center gap-2">
                          <img
                            src={option.flag}
                            alt=""
                            style={{ height: '16px', width: '24px', objectFit: 'cover', borderRadius: '2px' }}
                          />
                          <span>{option.label}</span>
                        </div>
                      )}
                      placeholder="Select country"
                      isClearable
                      classNamePrefix="select"
                    />
                  )}
                  <Input
                    id="location-city"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                      if (selectedCountry) {
                        const location = e.target.value.trim()
                          ? `${e.target.value.trim()}, ${selectedCountry.name}`
                          : selectedCountry.name;
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
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Additional Information</h3>

          <form.Field name="gender">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  id="gender"
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                  ]}
                  value={field.state.value ? {
                    value: field.state.value,
                    label: field.state.value === "MALE" ? "Male" : "Female"
                  } : null}
                  onChange={(option) => {
                    if (option) {
                      field.handleChange(option.value as "MALE" | "FEMALE");
                    }
                  }}
                  classNamePrefix="select"
                />
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
              <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/30">
                <input
                  type="checkbox"
                  id="isFav"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isFav" className="cursor-pointer font-normal">
                  Mark as favorite staff member
                </Label>
              </div>
            )}
          </form.Field>
          </div>

          <SheetFooter className="pt-6 border-t">
            <div className="flex w-full gap-3">
              {staffData && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={isSubmitting}
                  className="mr-auto"
                  size="lg"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                size="lg"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                size="lg"
                className="flex-1"
              >
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
