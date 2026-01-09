import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate issue details (title, description) based on ML classification result
 * @param {Object} classificationResult - The ML model classification result
 * @param {string} classificationResult.category - Detected category (e.g., "ROAD_POTHOLE")
 * @param {number} classificationResult.confidence - Confidence score (0-100)
 * @param {string} classificationResult.department - Assigned department
 * @param {string} classificationResult.priority - Priority level (low/medium/high)
 * @returns {Promise<Object>} Generated title, description, and form values
 */
export async function generateIssueDetails(classificationResult) {
  const { category, confidence, department, priority } = classificationResult;

  // Format category for display (ROAD_POTHOLE -> Road Pothole)
  const formattedCategory = category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const prompt = `You are an AI assistant helping citizens report civic issues to their local government.

Based on an image classification, the following issue was detected:
- Category: ${formattedCategory}
- Confidence: ${confidence}%
- Assigned Department: ${department}
- Priority Level: ${priority}

Generate a concise and clear issue report with:
1. A short, descriptive title (max 60 characters) that a citizen would use to report this issue
2. A detailed description (2-3 sentences) explaining the issue and its potential impact on the community

Respond in JSON format only:
{
  "title": "your generated title here",
  "description": "your generated description here"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates civic issue reports. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content.trim();

    // Parse the JSON response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      // Fallback to default values
      parsed = {
        title: `${formattedCategory} Issue Reported`,
        description: `A ${formattedCategory.toLowerCase()} issue has been detected in this area. This requires attention from the ${department}.`,
      };
    }

    // Map ML category to form category value
    const categoryMapping = {
      ROAD_POTHOLE: "pothole",
      GARBAGE: "garbage",
      STREETLIGHT: "streetlight",
      INFRASTRUCTURE: "other",
      ROAD_SIGNS: "traffic",
      POLLUTION: "other",
      FALLEN_TREES: "other",
      GRAFFITI: "other",
      ILLEGAL_PARKING: "traffic",
    };

    return {
      success: true,
      data: {
        title: parsed.title,
        description: parsed.description,
        category: categoryMapping[category] || "other",
        priority: priority || "medium",
        department: department,
        originalCategory: category,
        confidence: confidence,
      },
    };
  } catch (error) {
    console.error("OpenAI API error:", error.message);

    // Return fallback values on error
    return {
      success: false,
      error: error.message,
      data: {
        title: `${formattedCategory} Issue`,
        description: `A ${formattedCategory.toLowerCase()} issue has been detected and requires attention.`,
        category: "other",
        priority: priority || "medium",
        department: department,
        originalCategory: category,
        confidence: confidence,
      },
    };
  }
}

export default { generateIssueDetails };
