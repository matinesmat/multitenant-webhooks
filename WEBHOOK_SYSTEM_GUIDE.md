# 🔄 Complete Webhook System Guide

Your multitenant webhook application now has a complete bidirectional webhook system!

## 📋 **System Overview**

### **Outgoing Webhooks (Your App → External Systems)**
- When you create/update/delete students, agencies, or applications
- Data is automatically sent to configured external URLs
- Includes proper headers and authentication

### **Incoming Webhooks (External Systems → Your App)**
- External systems can send data to your app
- Data is automatically saved to Supabase
- Supports students, applications, and agencies

## 🚀 **How to Use**

### **1. Outgoing Webhooks (Automatic)**

When you create a student in your app:

1. **Student is saved to Supabase**
2. **Webhook is automatically sent** to configured external URLs
3. **External system receives the data**

**Example payload sent to external systems:**
```json
{
  "event": "student.created",
  "student": {
    "id": "student-123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "organization": {
    "slug": "your-org-slug",
    "name": "Your Organization"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **2. Incoming Webhooks (External → Your App)**

External systems can send data to your app:

**Endpoint:** `https://yourapp.com/api/webhooks/incoming`

**Headers:**
```
Content-Type: application/json
X-Event-Type: student.created
X-Organization-Slug: your-org-slug
```

**Example request:**
```bash
curl -X POST https://yourapp.com/api/webhooks/incoming \
  -H "Content-Type: application/json" \
  -H "X-Event-Type: student.created" \
  -H "X-Organization-Slug: your-org-slug" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "status": "active",
    "external_id": "ext-123"
  }'
```

## 🧪 **Testing the System**

### **Test Outgoing Webhooks**

1. **Get a webhook URL** from [webhook.site](https://webhook.site) or [ngrok](https://ngrok.com)
2. **Configure webhook** in your app's webhook settings
3. **Create a student** - webhook will be sent automatically

### **Test Incoming Webhooks**

1. **Use the demo endpoint:**
   ```
   GET https://yourapp.com/api/webhooks/demo?org=your-org-slug&url=https://webhook.site/your-id
   ```

2. **Send test data:**
   ```bash
   curl -X POST https://yourapp.com/api/webhooks/incoming \
     -H "Content-Type: application/json" \
     -H "X-Event-Type: student.created" \
     -H "X-Organization-Slug: your-org-slug" \
     -d '{"first_name": "Test", "last_name": "User", "email": "test@example.com"}'
   ```

## 📊 **Supported Event Types**

### **Outgoing Events (Your App Sends)**
- `student.created` - When a student is created
- `student.updated` - When a student is updated
- `student.deleted` - When a student is deleted
- `application.created` - When an application is created
- `agency.created` - When an agency is created

### **Incoming Events (External Systems Can Send)**
- `student.created` - Create a new student
- `student.updated` - Update an existing student
- `student.deleted` - Delete a student
- `application.created` - Create a new application
- `agency.created` - Create a new agency

## 🔧 **Configuration**

### **Webhook Settings in Your App**

1. **Go to Webhook Settings** in your dashboard
2. **Add New Webhook:**
   - **Name:** Descriptive name
   - **URL:** External system endpoint
   - **Events:** Select which events to send
   - **Resources:** Select which resources to include
   - **Secret Key:** Optional for security

### **External System Setup**

External systems should:
1. **Accept POST requests** at their webhook endpoint
2. **Parse JSON payload** from your app
3. **Send data back** to your incoming webhook endpoint
4. **Use proper headers** for authentication

## 🛡️ **Security Features**

- **Optional HMAC Signatures** for webhook verification
- **Organization Scoping** - webhooks are organization-specific
- **Error Handling** - graceful failure without breaking main functionality
- **Rate Limiting** - built-in protection against abuse

## 📝 **Example Integration**

### **Complete Flow Example:**

1. **External system** sends student data to your app
2. **Your app** saves student to Supabase
3. **Your app** sends webhook to another external system
4. **Other system** processes the student data

### **Code Example for External Systems:**

```javascript
// Send data to your app
const response = await fetch('https://yourapp.com/api/webhooks/incoming', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Event-Type': 'student.created',
    'X-Organization-Slug': 'your-org-slug'
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    status: 'active',
    external_id: 'ext-123'
  })
});

// Receive webhooks from your app
app.post('/webhook', (req, res) => {
  const { event, student, organization } = req.body;
  
  if (event === 'student.created') {
    console.log('New student:', student);
    // Process the student data
  }
  
  res.json({ success: true });
});
```

## ✅ **What's Working Now**

- ✅ **Outgoing Webhooks** - Automatic when creating students
- ✅ **Incoming Webhooks** - External systems can send data
- ✅ **Bidirectional Flow** - Complete webhook system
- ✅ **Error Handling** - Graceful failure handling
- ✅ **Organization Scoping** - Multi-tenant support
- ✅ **Testing Endpoints** - Easy testing and debugging

## 🎉 **You're All Set!**

Your webhook system is now complete and ready for production use. External systems can integrate with your app seamlessly in both directions!
