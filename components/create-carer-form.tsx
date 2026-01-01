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
        
        console.log("Form submission body:", value);
        
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
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{carerData ? "Edit Carer" : "Create New Carer"}</SheetTitle>
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
                  placeholder="Enter carer name"
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

          <SheetFooter className="pt-4">
            <div className="flex w-full gap-2">
              {carerData && (
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
                className={!carerData ? "ml-auto" : ""}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
