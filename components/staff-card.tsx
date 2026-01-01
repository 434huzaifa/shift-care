"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  IoLocationOutline, 
  IoBriefcaseOutline, 
  IoPersonOutline,
  IoHeart,
  IoHeartOutline 
} from "react-icons/io5";
import { HiOutlineDotsVertical } from "react-icons/hi";

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
  };
  onToggleFavorite?: (id: number) => void;
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

export function StaffCard({ staff, onToggleFavorite }: StaffCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Header with name and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <IoPersonOutline className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{staff.name}</h3>
            <span className="text-xs text-muted-foreground">{staff.gender === "MALE" ? "♂" : "♀"}</span>
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
          <button className="p-1 hover:bg-accent rounded transition-colors">
            <HiOutlineDotsVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Job Title */}
      <div className="flex items-center gap-2 mb-2 text-sm">
        <IoBriefcaseOutline className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground">Job Title</span>
        <span className="font-medium ml-auto">{staff.jobTitle}</span>
      </div>

      {/* Nationality */}
      <div className="flex items-center gap-2 mb-2 text-sm">
        <IoPersonOutline className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground">Nationality</span>
        <div className="flex items-center gap-2 ml-auto">
          {staff.nationalityFlag && (
            <img
              src={staff.nationalityFlag}
              alt=""
              className="h-3 w-5 object-cover rounded-sm"
            />
          )}
          <span className="font-medium">{staff.nationality}</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <IoLocationOutline className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground">Location</span>
        <div className="flex items-center gap-2 ml-auto">
          {staff.locationFlag && (
            <img
              src={staff.locationFlag}
              alt=""
              className="h-3 w-5 object-cover rounded-sm"
            />
          )}
          <span className="font-medium text-right">{staff.location}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Status</span>
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
