import csvParser from "csv-parser";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "100");

  const filePath = path.join(process.cwd(), "data", "data.csv");
  const songs: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => songs.push(data))
      .on("end", () => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedSongs = songs.slice(start, end);
        resolve(NextResponse.json(paginatedSongs));
      })
      .on("error", (error) => reject(NextResponse.error()));
  });
}
