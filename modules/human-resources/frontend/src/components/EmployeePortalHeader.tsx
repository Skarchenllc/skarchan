"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  CalendarDays,
  Clock,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users
} from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  work_email?: string;
}

export default function EmployeePortalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    // Load employee data from localStorage using employee_id
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      // Redirect to login if not authenticated
      router.push("/employee-portal/login");
      return;
    }

    // Fetch employee data from API
    const loadEmployeeData = async () => {
      try {
        const response = await fetch(`/api/hr/employees/${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        } else {
          router.push("/employee-portal/login");
        }
      } catch (error) {
        console.error("Failed to load employee data:", error);
        router.push("/employee-portal/login");
      }
    };

    loadEmployeeData();
  }, [router]);

  if (!employee) return null;

  return <Navigation />;
}
