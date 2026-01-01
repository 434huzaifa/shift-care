"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IoEllipsisVertical, IoMail, IoMaleFemale } from "react-icons/io5";

interface CarerCardProps {
  carer: {
    id: number;
    name: string;
    email: string;
    gender: "MALE" | "FEMALE";
    profileImage?: string | { type: string; data: number[] } | null;
    createdAt: string;
    updatedAt: string;
  };
  onEdit: () => void;
}

export function CarerCard({ carer, onEdit }: CarerCardProps) {
  // Handle profile image display
  let profileImageSrc = "";

  if (carer.profileImage) {
    if (typeof carer.profileImage === "string") {
      // Already a string
      profileImageSrc = carer.profileImage;
    } else if (typeof carer.profileImage === "object") {
      // Raw Buffer object with numeric keys {0: 255, 1: 216, ...}
      const byteArray = Object.values(
        carer.profileImage as unknown as Record<string, number>
      );
      const buffer = Buffer.from(byteArray);
      profileImageSrc = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all hover:scale-[1.02] duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt={carer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {carer.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <IoEllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate">{carer.name}</h3>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <IoMail className="h-3 w-3 shrink-0" />
            {carer.email}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <IoMaleFemale className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-xs">Gender</span>
          <Badge variant="outline" className="ml-auto">
            {carer.gender === "MALE" ? "Male" : "Female"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
