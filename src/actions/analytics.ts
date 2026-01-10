"use server";

import { getFinancialHealthData } from "@/services/financial-health.service";
import { getDashboardData } from "@/services/dashboard.service";

export async function getAnalyticsDataAction(view: string, searchParams: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dashboardData, healthData] = await Promise.all([
        getDashboardData(view, searchParams),
        getFinancialHealthData(view, searchParams)
    ]);

    return {
        dashboardData,
        healthData
    };
}
