import { NextRequest, NextResponse } from "next/server";

// Demo endpoint to test the complete webhook flow
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orgSlug = url.searchParams.get('org') || 'demo-org';
  const webhookUrl = url.searchParams.get('url') || 'https://webhook.site/your-unique-id';

  // Example payload that would be sent to external systems
  const demoPayload = {
    event: "student.created",
    student: {
      id: "demo-student-123",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      status: "active",
      created_at: new Date().toISOString()
    },
    organization: {
      slug: orgSlug,
      name: "Demo Organization"
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Send webhook to external URL
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Type": "student.created",
        "X-Organization-Slug": orgSlug
      },
      body: JSON.stringify(demoPayload)
    });

    return NextResponse.json({
      success: true,
      message: "Demo webhook sent successfully!",
      webhookUrl,
      payload: demoPayload,
      response: {
        status: response.status,
        statusText: response.statusText
      },
      instructions: {
        outgoing: "This simulates what happens when you create a student in your app",
        incoming: `To test incoming webhooks, send POST to: ${request.nextUrl.origin}/api/webhooks/incoming`,
        example: {
          url: `${request.nextUrl.origin}/api/webhooks/incoming`,
          headers: {
            "Content-Type": "application/json",
            "X-Event-Type": "student.created",
            "X-Organization-Slug": orgSlug
          },
          body: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com",
            status: "active",
            external_id: "ext-456"
          }
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to send demo webhook",
      message: error instanceof Error ? error.message : "Unknown error",
      instructions: {
        outgoing: "This simulates what happens when you create a student in your app",
        incoming: `To test incoming webhooks, send POST to: ${request.nextUrl.origin}/api/webhooks/incoming`,
        example: {
          url: `${request.nextUrl.origin}/api/webhooks/incoming`,
          headers: {
            "Content-Type": "application/json",
            "X-Event-Type": "student.created",
            "X-Organization-Slug": orgSlug
          },
          body: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com",
            status: "active",
            external_id: "ext-456"
          }
        }
      }
    });
  }
}
