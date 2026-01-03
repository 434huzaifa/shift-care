"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { NextPage } from "next";
import { CreateStaffForm } from "@/components/create-staff-form";
import { StaffCard } from "@/components/staff-card";
import { useState, useEffect } from "react";
import React from "react";
import { IoSearch, IoAdd } from "react-icons/io5";
import { Spinner } from "@/components/ui/spinner";
import { showSuccess, showError } from "@/lib/toast";

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
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

const Page: NextPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const limit = 12;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        status: statusFilter,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/staff?${params}`);
      const data = await response.json();
      
      if (data.staff) {
        setStaff(data.staff);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch {
      showError("Failed to fetch staff", "Please try refreshing the page");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, searchQuery]);

  const handleToggleFavorite = async (id: number) => {
    const staffMember = staff.find((s) => s.id === id);
    if (!staffMember) return;

    const newFavStatus = !staffMember.isFav;

    try {
      // Optimistic update
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFav: newFavStatus } : s))
      );

      const response = await fetch(`/api/staff/${id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFav: newFavStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update favorite status");
      }

      showSuccess(
        newFavStatus ? "Added to favorites" : "Removed from favorites"
      );
      
      // Refetch to get updated order with favorites first
      await fetchStaff();
    } catch {
      // Revert on error
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFav: staffMember.isFav } : s))
      );
      showError("Failed to update favorite status", "Please try again");
    }
  };

  const handleEdit = (id: number) => {
    const staffToEdit = staff.find((s) => s.id === id);
    if (staffToEdit) {
      setEditingStaff(staffToEdit);
      setIsCreateOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setIsCreateOpen(false);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => {
          setEditingStaff(null);
          setIsCreateOpen(true);
        }} className="gap-2">
          <IoAdd className="w-5 h-5" />
          Add Staff
        </Button>
      </div>

      {isMounted && (
        <Tabs value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
          <TabsList>
            <TabsTrigger value="ALL">All Staff</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="INACTIVE">Inactive</TabsTrigger>
            <TabsTrigger value="ON_LEAVE">On Leave</TabsTrigger>
            <TabsTrigger value="TERMINATED">Terminated</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "ALL"
              ? "No staff found matching your filters"
              : "No staff members yet. Create your first staff member!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
            {staff.map((staffMember) => (
              <StaffCard
                key={staffMember.id}
                staff={staffMember}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEdit}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {staff.length} of {total} staff members
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || 
                           page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, idx, array) => (
                    <React.Fragment key={page}>
                      {idx > 0 && array[idx - 1] !== page - 1 && (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-4">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      <CreateStaffForm
        open={isCreateOpen}
        onOpenChange={handleCloseSheet}
        onSuccess={() => {
          fetchStaff();
        }}
        staffData={editingStaff}
      />
    </div>
  );
};

export default Page;
