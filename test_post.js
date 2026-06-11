const payload = {
  "object": "page",
  "entry": [
    {
      "id": "123",
      "time": 1234567890,
      "changes": [
        {
          "value": {
            "form_id": "test_form_id",
            "leadgen_id": "test_lead_123",
            "created_time": 1234567890,
            "page_id": "123"
          },
          "field": "leadgen"
        }
      ]
    }
  ]
};

fetch("https://rmfwgevwqavlqniiomth.supabase.co/functions/v1/meta-webhooks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(async res => {
  console.log("Status:", res.status);
  console.log("Text:", await res.text());
})
.catch(err => console.error("Error:", err));
