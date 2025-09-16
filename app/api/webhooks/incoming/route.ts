import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify webhook signature (optional)
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Handle incoming webhook data
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature') || '';
    const eventType = request.headers.get('x-event-type') || 'unknown';
    const organizationSlug = request.headers.get('x-organization-slug') || '';
    
    console.log("📥 Incoming webhook received:", {
      eventType,
      organizationSlug,
      signature: signature ? 'present' : 'missing'
    });

    // Parse the incoming data
    let incomingData;
    try {
      incomingData = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Get organization ID
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .single();

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Handle different event types
    switch (eventType.toLowerCase()) {
      case 'student.created':
      case 'student.updated':
        return await handleStudentData(incomingData, organization.id, eventType);
      
      case 'student.deleted':
        return await handleStudentDeletion(incomingData, organization.id);
      
      case 'application.created':
      case 'application.updated':
        return await handleApplicationData(incomingData, organization.id, eventType);
      
      case 'agency.created':
      case 'agency.updated':
        return await handleAgencyData(incomingData, organization.id, eventType);
      
      default:
        return await handleGenericData(incomingData, organization.id, eventType);
    }
  } catch (error) {
    console.error("❌ Error processing incoming webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle student data
async function handleStudentData(data: any, organizationId: string, eventType: string) {
  try {
    const studentData = {
      first_name: data.first_name || data.firstName || '',
      last_name: data.last_name || data.lastName || '',
      email: data.email || null,
      status: data.status || 'active',
      org_id: organizationId,
      external_id: data.external_id || data.id || null, // Store external system ID
      metadata: data.metadata || data.additional_data || null
    };

    if (eventType.includes('created')) {
      const { data: student, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (error) {
        console.error("Error creating student:", error);
        return NextResponse.json(
          { success: false, error: "Failed to create student" },
          { status: 500 }
        );
      }

      console.log("✅ Student created from webhook:", student.id);
      return NextResponse.json({ success: true, data: student });
    } else {
      // Update existing student
      const { data: student, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('external_id', data.external_id || data.id)
        .eq('org_id', organizationId)
        .select()
        .single();

      if (error) {
        console.error("Error updating student:", error);
        return NextResponse.json(
          { success: false, error: "Failed to update student" },
          { status: 500 }
        );
      }

      console.log("✅ Student updated from webhook:", student.id);
      return NextResponse.json({ success: true, data: student });
    }
  } catch (error) {
    console.error("Error handling student data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process student data" },
      { status: 500 }
    );
  }
}

// Handle student deletion
async function handleStudentDeletion(data: any, organizationId: string) {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('external_id', data.external_id || data.id)
      .eq('org_id', organizationId);

    if (error) {
      console.error("Error deleting student:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete student" },
        { status: 500 }
      );
    }

    console.log("✅ Student deleted from webhook");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling student deletion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process student deletion" },
      { status: 500 }
    );
  }
}

// Handle application data
async function handleApplicationData(data: any, organizationId: string, eventType: string) {
  try {
    const applicationData = {
      student_id: data.student_id || data.studentId,
      agency_id: data.agency_id || data.agencyId,
      status: data.status || 'pending',
      notes: data.notes || null,
      organization_id: organizationId,
      external_id: data.external_id || data.id || null,
      metadata: data.metadata || null
    };

    if (eventType.includes('created')) {
      const { data: application, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) {
        console.error("Error creating application:", error);
        return NextResponse.json(
          { success: false, error: "Failed to create application" },
          { status: 500 }
        );
      }

      console.log("✅ Application created from webhook:", application.id);
      return NextResponse.json({ success: true, data: application });
    } else {
      const { data: application, error } = await supabase
        .from('applications')
        .update(applicationData)
        .eq('external_id', data.external_id || data.id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        console.error("Error updating application:", error);
        return NextResponse.json(
          { success: false, error: "Failed to update application" },
          { status: 500 }
        );
      }

      console.log("✅ Application updated from webhook:", application.id);
      return NextResponse.json({ success: true, data: application });
    }
  } catch (error) {
    console.error("Error handling application data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process application data" },
      { status: 500 }
    );
  }
}

// Handle agency data
async function handleAgencyData(data: any, organizationId: string, eventType: string) {
  try {
    const agencyData = {
      name: data.name || '',
      contact_email: data.contact_email || data.email || null,
      contact_phone: data.contact_phone || data.phone || null,
      address: data.address || null,
      organization_id: organizationId,
      external_id: data.external_id || data.id || null,
      metadata: data.metadata || null
    };

    if (eventType.includes('created')) {
      const { data: agency, error } = await supabase
        .from('agencies')
        .insert(agencyData)
        .select()
        .single();

      if (error) {
        console.error("Error creating agency:", error);
        return NextResponse.json(
          { success: false, error: "Failed to create agency" },
          { status: 500 }
        );
      }

      console.log("✅ Agency created from webhook:", agency.id);
      return NextResponse.json({ success: true, data: agency });
    } else {
      const { data: agency, error } = await supabase
        .from('agencies')
        .update(agencyData)
        .eq('external_id', data.external_id || data.id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        console.error("Error updating agency:", error);
        return NextResponse.json(
          { success: false, error: "Failed to update agency" },
          { status: 500 }
        );
      }

      console.log("✅ Agency updated from webhook:", agency.id);
      return NextResponse.json({ success: true, data: agency });
    }
  } catch (error) {
    console.error("Error handling agency data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process agency data" },
      { status: 500 }
    );
  }
}

// Handle generic data
async function handleGenericData(data: any, organizationId: string, eventType: string) {
  try {
    // Log the incoming data for debugging
    console.log("📝 Generic webhook data received:", {
      eventType,
      organizationId,
      data: JSON.stringify(data, null, 2)
    });

    // You can add custom logic here to handle other types of data
    // For now, just log and acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: "Data received and logged",
      eventType,
      organizationId
    });
  } catch (error) {
    console.error("Error handling generic data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process data" },
      { status: 500 }
    );
  }
}
