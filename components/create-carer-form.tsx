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
import { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/ui/field-error";
import { resizeImage, MAX_FILE_SIZE, IMAGE_SIZE } from "@/lib/image-utils";
import Select from "react-select";

const carerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  gender: z.enum(["MALE", "FEMALE"]),
  profileImage: z.string().optional(),
});

type CarerFormData = z.infer<typeof carerSchema>;

interface CreateCarerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  carerData?: {
    id: number;
    name: string;
    email: string;
    gender: "MALE" | "FEMALE";
    profileImage?: string | null;
  } | null;
}

export function CreateCarerForm({
  open,
  onOpenChange,
  onSuccess,
  carerData,
}: CreateCarerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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

  const form = useForm({
    defaultValues: carerData ? {
      name: carerData.name,
      email: carerData.email,
      gender: carerData.gender,
      profileImage: carerData.profileImage || "",
    } : {
      name: "",
      email: "",
      gender: "MALE",
      profileImage: "",
    } as CarerFormData,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const url = carerData ? `/api/carer/${carerData.id}` : "/api/carer";
        const method = carerData ? "PUT" : "POST";
        
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        if (!response.ok) {
          let errorMessage = carerData ? "Failed to update carer" : "Failed to create carer";
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
          
          showError(errorMessage, "Please check the form and try again");
          return;
        }

        await response.json();
        showSuccess(
          carerData ? "Carer updated successfully!" : "Carer created successfully!",
          carerData ? `${value.name}'s information has been updated` : `${value.name} has been added to the team`
        );
        onOpenChange(false);
        onSuccess?.();
        form.reset();
        setImagePreview(null);
      } catch {
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
    if (!carerData) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/carer/${carerData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete carer");
      }

      showSuccess("Carer deleted successfully!", `${carerData.name} has been removed from the system`);
      setShowDeleteAlert(false);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      showError("Failed to delete carer", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl">{carerData ? "Edit Carer" : "Create New Carer"}</SheetTitle>
          <SheetDescription>
            {carerData ? "Update carer information" : "Add a new carer to your team"}
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
                <FieldError errors={field.state.meta.errors} />
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
                      Max {MAX_FILE_SIZE / 1024 / 1024}MB. Image will be resized to {IMAGE_SIZE}x{IMAGE_SIZE}px
                    </p>
                    {carerData && !imagePreview && (
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
                <FieldError errors={field.state.meta.errors} />
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
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
          </div>

          <SheetFooter className="pt-6 border-t">
            <div className="flex w-full gap-3">
              {carerData && (
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
              <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1">
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    {carerData ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  carerData ? "Update Carer" : "Create Carer"
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
              This will permanently delete {carerData?.name}. This action cannot be undone.
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
