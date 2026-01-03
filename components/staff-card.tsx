"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  IoLocationOutline,
  IoBriefcaseOutline,
  IoPersonOutline,
  IoHeart,
  IoHeartOutline,
  IoFemaleSharp,
  IoMaleSharp,
} from "react-icons/io5";
import { HiOutlineDotsVertical, HiStatusOnline } from "react-icons/hi";
import { MdEdit } from "react-icons/md";

interface StaffCardProps {
  staff: {
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
    profileImage?: string | { type: string; data: number[] } | null;
  };
  onToggleFavorite?: (id: number) => void;
  onEdit?: (id: number) => void;
}

const statusColors = {
  ACTIVE: "bg-green-500/10 text-green-600 border-green-500/20",
  INACTIVE: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  ON_LEAVE: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  TERMINATED: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  TERMINATED: "Terminated",
};

export function StaffCard({ staff, onToggleFavorite, onEdit }: StaffCardProps) {
  // Handle profileImage - convert Buffer object to base64 string
  let profileImageSrc: string | null = null;
  
  if (staff.profileImage) {
    if (typeof staff.profileImage === 'string') {
      // Already a string
      profileImageSrc = staff.profileImage;
    } else if (typeof staff.profileImage === 'object') {
      // Raw Buffer object with numeric keys {0: 255, 1: 216, ...}
      const byteArray = Object.values(staff.profileImage as unknown as Record<string, number>);
      const buffer = Buffer.from(byteArray);
      profileImageSrc = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow min-w-70">
      {/* Header with name and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profileImageSrc ? (
              <img
                src={profileImageSrc}
                alt={staff.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <IoPersonOutline className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex">
            <h3 className="font-bold text-xs underline">{staff.name}</h3>
            <span className="text-md text-muted-foreground">
              {staff.gender === "MALE" ? (
                <IoMaleSharp className="text-blue-700" />
              ) : (
                <IoFemaleSharp className="text-pink-700" />
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite?.(staff.id)}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            {staff.isFav ? (
              <IoHeart className="w-5 h-5 text-red-500" />
            ) : (
              <IoHeartOutline className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-accent rounded transition-colors">
                <HiOutlineDotsVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(staff.id)}>
                <MdEdit className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Job Title */}
      <div className="flex items-center gap-2  text-xs">
        <IoBriefcaseOutline className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground font-normal">Job Title</span>
        <span className="font-semibold ml-auto">{staff.jobTitle}</span>
      </div>

      {/* Nationality */}
      <div className="flex items-center gap-2 text-xs">
        <IoPersonOutline className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground font-normal">Nationality</span>
        <div className="flex items-center gap-2 ml-auto">
          {staff.nationalityFlag && (
            <img
              src={staff.nationalityFlag}
              alt=""
              className="h-3 w-5 object-cover rounded-sm"
            />
          )}
          <span className="font-semibold">{staff.nationality}</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2  text-xs">
        <IoLocationOutline className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground font-normal">Location</span>
        <div className="flex items-center gap-2 ml-auto">
          {staff.locationFlag && (
            <img
              src={staff.locationFlag}
              alt=""
              className="h-3 w-5 object-cover rounded-sm"
            />
          )}
          <span className="font-semibold text-right">{staff.location}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-xs">
        <HiStatusOnline className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground font-normal">Status</span>
        <Badge
          variant="outline"
          className={cn("ml-auto", statusColors[staff.status])}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
          {statusLabels[staff.status]}
        </Badge>
      </div>
    </Card>
  );
}
