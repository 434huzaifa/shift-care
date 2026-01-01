"use client";

import { NextPage } from "next";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoAdd, IoSearch } from "react-icons/io5";
import { CreateCarerForm } from "@/components/create-carer-form";
import { CarerCard } from "@/components/carer-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import React from "react";

interface Carer {
  id: number;
  name: string;
  email: string;
  gender: "MALE" | "FEMALE";
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

const Page: NextPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [carers, setCarers] = useState<Carer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingCarer, setEditingCarer] = useState<Carer | null>(null);

  const fetchCarers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/carer?${params}`);
      if (!response.ok) throw new Error("Failed to fetch carers");

      const data = await response.json();
      setCarers(data.carers);
      setTotalPages(data.pagination.totalPages);
    } catch {
      console.error("Failed to fetch carers");
    }
  };

  useEffect(() => {
    fetchCarers();
  }, [currentPage, searchQuery]);

  const handleEdit = (carer: Carer) => {
    setEditingCarer(carer);
    setIsCreateOpen(true);
  };

  const handleFormClose = () => {
    setIsCreateOpen(false);
    setEditingCarer(null);
  };

  const handleFormSuccess = () => {
    fetchCarers();
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <React.Fragment key={i}>
          <PaginationItem>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        </React.Fragment>
      );
    }

    return pages;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Carer Management</h1>
          <p className="text-muted-foreground mt-1">
            Showing {carers.length} {carers.length === 1 ? "carer" : "carers"}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <IoAdd className="mr-2 h-5 w-5" />
          Add Carer
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {carers.map((carer) => (
          <CarerCard
            key={carer.id}
            carer={carer}
            onEdit={() => handleEdit(carer)}
          />
        ))}
      </div>

      <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {renderPageNumbers()}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

      <CreateCarerForm
        open={isCreateOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
        carerData={editingCarer}
      />
    </div>
  );
};

export default Page;
