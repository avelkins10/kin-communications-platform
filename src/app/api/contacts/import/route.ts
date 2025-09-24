import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csvContactSchema, csvImportResultSchema } from "@/lib/validations/contact";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV files are allowed." },
        { status: 400 }
      );
    }

    // Parse CSV content
    const csvContent = await file.text();
    const lines = csvContent.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain at least a header row and one data row." },
        { status: 400 }
      );
    }

    // Parse header row
    const headers = lines[0]?.split(",").map(h => h.trim().toLowerCase()) || [];
    const dataRows = lines.slice(1);

    // Expected headers mapping
    const headerMapping: { [key: string]: string } = {
      "first name": "firstName",
      "firstname": "firstName",
      "last name": "lastName", 
      "lastname": "lastName",
      "phone": "phone",
      "phone number": "phone",
      "email": "email",
      "organization": "organization",
      "company": "organization",
      "type": "type",
      "department": "department",
      "notes": "notes",
      "tags": "tags",
      "quickbase id": "quickbaseId",
      "quickbaseid": "quickbaseId",
      "favorite": "isFavorite",
      "is favorite": "isFavorite",
    };

    // Map headers to field names
    const fieldMapping: { [key: number]: string } = {};
    headers.forEach((header, index) => {
      const mappedField = headerMapping[header];
      if (mappedField) {
        fieldMapping[index] = mappedField;
      }
    });

    // Validate required fields are present
    if (!fieldMapping[headers.indexOf("first name")] && !fieldMapping[headers.indexOf("firstname")]) {
      return NextResponse.json(
        { error: "CSV must contain a 'First Name' column." },
        { status: 400 }
      );
    }

    if (!fieldMapping[headers.indexOf("last name")] && !fieldMapping[headers.indexOf("lastname")]) {
      return NextResponse.json(
        { error: "CSV must contain a 'Last Name' column." },
        { status: 400 }
      );
    }

    if (!fieldMapping[headers.indexOf("phone")] && !fieldMapping[headers.indexOf("phone number")]) {
      return NextResponse.json(
        { error: "CSV must contain a 'Phone' column." },
        { status: 400 }
      );
    }

    const results = {
      success: true,
      imported: 0,
      errors: [] as string[],
      duplicates: 0,
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row) continue;
      const values = row.split(",").map(v => v.trim().replace(/^"|"$/g, ""));

      try {
        // Build contact data object
        const contactData: any = {};
        
        Object.entries(fieldMapping).forEach(([index, field]) => {
          const value = values[parseInt(index)];
          if (value) {
            if (field === "tags") {
              // Handle comma-separated tags
              contactData[field] = value.split(",").map((tag: string) => tag.trim()).filter(Boolean);
            } else if (field === "isFavorite") {
              // Handle boolean values
              contactData[field] = value.toLowerCase() === "true" || value.toLowerCase() === "yes" || value === "1";
            } else {
              contactData[field] = value;
            }
          }
        });

        // Validate contact data
        const validatedData = csvContactSchema.parse(contactData);

        // Create contact, handle uniqueness via DB
        try {
          await prisma.contact.create({
            data: {
              ...validatedData,
              ownerId: session.user.id,
              tags: Array.isArray(validatedData.tags) ? validatedData.tags : [],
            },
          });
        } catch (e: any) {
          if (e?.code === "P2002") {
            results.duplicates++;
            results.errors.push(`Row ${i + 2}: Contact with phone ${validatedData.phone} already exists`);
            continue;
          }
          throw e;
        }

        results.imported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Row ${i + 2}: ${errorMessage}`);
      }
    }

    // Validate results
    const validatedResults = csvImportResultSchema.parse(results);

    return NextResponse.json(validatedResults);
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}
