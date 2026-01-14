import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  const uri = process.env.MONGODB_URI || "";
  const isSrv = uri.includes("+srv");
  const protocol = uri.split("://")[0];
  
  try {
    const start = Date.now();
    
    // Check if already connected
    const state = mongoose.connection.readyState;
    
    // Attempt simple Query
    let dbStatus = "Unknown";
    let queryTime = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let appLogicTest: any = "Not Run";

    if (state === 1) {
        dbStatus = "Connected (Cached)";
        await mongoose.connection.db?.admin().ping();
        queryTime = Date.now() - start;
    } else {
        dbStatus = "Not Connected, attempting...";
         if (!uri) throw new Error("No MONGODB_URI");
         await mongoose.connect(uri, { 
             bufferCommands: false,
             serverSelectionTimeoutMS: 5000,
             socketTimeoutMS: 45000,
         });
         await mongoose.connection.db?.admin().ping();
         dbStatus = "Connected (Fresh)";
         queryTime = Date.now() - start;
    }

    // TEST APPLICATION LOGIC
    try {
        const { getDashboardData } = await import("@/services/dashboard.service");
        // Test with "ALL" view to stimulate aggregation
        const dashboardData = await getDashboardData("ALL"); 
        appLogicTest = {
            status: "Success",
            summary: dashboardData.summary
        };
    } catch (logicError: any) {
         appLogicTest = {
            status: "Failed",
            error: logicError.message,
            stack: logicError.stack
        };
    }

    return NextResponse.json({
        status: "OK", 
        protocol, 
        isSrv, 
        dbStatus,
        queryTime: `${queryTime}ms`,
        appLogicTest
    });
  } catch (error: any) {
    return NextResponse.json({ 
        status: "ERROR", 
        error: error.message,
        stack: error.stack,
        protocol,
        isSrv 
    }, { status: 500 });
  }
}
