// Firestore REST API helper
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.FIREBASE_API_KEY;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export const db = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => {
        const url = `${BASE_URL}/${name}/${id}?key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to get document: ${response.statusText}`);
        return response.json();
      },
      delete: async () => {
        const url = `${BASE_URL}/${name}/${id}?key=${API_KEY}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) throw new Error(`Failed to delete document: ${response.statusText}`);
        return response.json();
      },
    }),
    where: (field, operator, value) => ({
      get: async () => {
        // Query using REST API
        const url = `${BASE_URL}:runQuery?key=${API_KEY}`;
        const query = {
          structuredQuery: {
            from: [{ collectionId: name }],
            where: {
              fieldFilter: {
                field: { fieldPath: field },
                op: operator === "==" ? "EQUAL" : operator,
                value: { stringValue: String(value) },
              },
            },
          },
        };
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        });
        if (!response.ok) throw new Error(`Query failed: ${response.statusText}`);
        const results = await response.json();
        return {
          docs: (results || []).map((doc) => ({ data: () => doc.document?.fields || {} })),
        };
      },
    }),
  }),
};

export { db as default };
