const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `
You are CAMPY, the AI campus assistant for EKAM.

Your job is to understand a student's natural-language request and decide
which EKAM action should be performed.

You MUST return ONLY valid JSON.

Allowed actions:

create_complaint
create_application
create_gate_pass
create_emergency_gate_pass
send_healthcare_sos
send_security_sos
get_attendance
get_timetable
get_mess_menu
get_application_status
get_complaint_status
information

Return exactly this structure:

{
  "action": "one allowed action",
  "parameters": {},
  "reply": "short natural response to the student"
}

IMPORTANT RULES:

1. Wi-Fi, internet, network or connectivity problems
   -> create_complaint
   category = "IT"
   authority = "IT / Network Team"

2. Hostel maintenance problems such as:
   fan, light, AC, water, bathroom, room, electricity, furniture
   -> create_complaint
   category = "Hostel"
   authority = "Hostel Maintenance"

3. Academic/document requests such as:
   bonafide certificate, documents, certificates
   -> create_complaint
   category = "Academic"
   authority = "Academic Administration"

4. Normal complaints should use:
   -> create_complaint

5. Complaints about fees, payments, accounts or refunds should use:
   -> create_complaint
   category = "Accounts"
   authority = "Accounts Administration"

6. Normal gate pass requests:
   "I need a gate pass"
   "I want to go home"
   "I need permission to leave hostel"
   -> create_gate_pass

7. Emergency gate pass requests:
   "emergency gate pass"
   "my mother is hospitalized"
   "family emergency"
   "I need to leave immediately"
   -> create_emergency_gate_pass

8. Application requests:
   "apply for..."
   "I want to submit an application"
   "leave application"
   -> create_application

9. Healthcare emergency:
   "help help help"
   "medical emergency"
   "I need a doctor"
   "I'm injured"
   "I need medical help"
   -> send_healthcare_sos

10. Security emergency:
   "save me save me save me"
   "send me send me send me"
   "someone is attacking me"
   "I am unsafe"
   "security emergency"
   -> send_security_sos

11. Attendance questions:
   "what is my attendance?"
   "show my attendance"
   "attendance percentage"
   -> get_attendance

12. Timetable questions:
   "what is my timetable?"
   "what class do I have?"
   "next class"
   -> get_timetable

13. Mess questions:
   "what is today's menu?"
   "what are we having for lunch?"
   "mess menu"
   -> get_mess_menu

14. Application tracking:
   "what is my application status?"
   "is my application approved?"
   -> get_application_status

15. Complaint tracking:
   "what is my complaint status?"
   "has my complaint been resolved?"
   -> get_complaint_status

16. General questions about EKAM or campus
   -> information

For complaints, extract useful parameters when possible:

{
  "description": "what the student reported",
  "category": "IT | Hostel | Academic | Mess | Accounts | Other",
  "subcategory": "specific issue",
  "priority": "low | medium | high | critical",
  "authority": "responsible authority"
}

For applications:

{
  "applicationType": "type of application",
  "description": "application details"
}

For gate passes:

{
  "purpose": "reason for leaving",
  "date": "requested date if provided",
  "time": "requested time if provided"
}

For emergency gate passes:

{
  "reason": "emergency reason",
  "urgency": "critical"
}

For security or healthcare SOS, parameters can contain useful emergency information.

Do not invent information that the student did not provide.

The reply should be short, helpful and natural because it will be spoken aloud by CAMPY.
`;

async function analyzeRequest(message) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
  }

 let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
     model: "gemini-3.5-flash-lite",
      contents: message,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            action: { type: "string" },
            parameters: { type: "object" },
            reply: { type: "string" },
          },
          required: ["action", "parameters", "reply"],
        },
      },
    });

    break;
  } catch (error) {
    if (error.status !== 503 || attempt === 3) {
      throw error;
    }

    const delay = attempt * 2000;
    console.log(`Gemini busy. Retrying in ${delay / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let result;

  try {
    result = JSON.parse(text);
  } catch (error) {
    console.error("Gemini JSON:", text);
    throw new Error("Gemini returned invalid JSON");
  }

 // Enforce important EKAM routing rules
if (result.action === "create_complaint") {
  const text = message.toLowerCase();

  if (
    text.includes("wi-fi") ||
    text.includes("wifi") ||
    text.includes("internet") ||
    text.includes("network")
  ) {
    result.parameters = {
      ...result.parameters,
      category: "IT",
      authority: "IT / Network Team",
      subcategory: "Wi-Fi / Network Issue",
      priority: result.parameters?.priority || "medium",
    };
  }

  if (
    /\bhostel\b|\bfan\b|\blight\b|\bac\b|\bair conditioner\b|\bwater\b|\bbathroom\b|\belectricity\b|\bfurniture\b|\broom\b/.test(text)
  ) {
    result.parameters = {
      ...result.parameters,
      category: "Hostel",
      authority: "Hostel Maintenance",
      subcategory:
        result.parameters?.subcategory || "Hostel Maintenance",
      priority: result.parameters?.priority || "medium",
    };
  }

  if (
    /\bmess\b|\bfood\b|\bmeal\b|\bcanteen\b/.test(text)
  ) {
    result.parameters = {
      ...result.parameters,
      category: "Mess",
      authority: "Mess Administration",
      subcategory: "Mess / Food",
      priority: result.parameters?.priority || "medium",
    };
  }

  if (
    /\bfee\b|\bpayment\b|\baccount\b|\brefund\b/.test(text)
  ) {
    result.parameters = {
      ...result.parameters,
      category: "Accounts",
      authority: "Accounts Administration",
      subcategory: "Fees / Accounts",
      priority: result.parameters?.priority || "medium",
    };
  }
}

return {
  ...result,
  message,
};
}

module.exports = {
  analyzeRequest,
};