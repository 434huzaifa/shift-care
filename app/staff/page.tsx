"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NextPage } from "next";
import { CreateStaffForm } from "@/components/create-staff-form";
import { StaffCard } from "@/components/staff-card";
import { useState, useEffect } from "react";
import { IoSearch, IoAdd } from "react-icons/io5";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface Staff {
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
  createdAt: string;
  updatedAt: string;
}

interface Props {}

const Page: NextPage<Props> = ({}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/staff");
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      toast.error("Failed to fetch staff");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleFavorite = async (id: number) => {
    const staffMember = staff.find((s) => s.id === id);
    if (!staffMember) return;

    try {
      // Optimistic update
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFav: !s.isFav } : s))
      );

      // TODO: Add API endpoint to update favorite status
      toast.success(
        staffMember.isFav ? "Removed from favorites" : "Added to favorites"
      );
    } catch (error) {
      // Revert on error
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFav: staffMember.isFav } : s))
      );
      toast.error("Failed to update favorite status");
    }
  };

  // Filter staff based on search and status
  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <IoAdd className="w-5 h-5" />
          Add Staff
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="ALL">All Staff</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="INACTIVE">Inactive</TabsTrigger>
          <TabsTrigger value="ON_LEAVE">On Leave</TabsTrigger>
          <TabsTrigger value="TERMINATED">Terminated</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "ALL"
              ? "No staff found matching your filters"
              : "No staff members yet. Create your first staff member!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((staffMember) => (
            <StaffCard
              key={staffMember.id}
              staff={staffMember}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      <CreateStaffForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          fetchStaff();
        }}
      />
    </div>
  );
};

export default Page;
