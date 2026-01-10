import OpenAI from "openai";
import Issue from "../models/Issue.js";
import { User } from "../models/userModel.js";

class RAGService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.maxContextIssues = parseInt(process.env.RAG_MAX_CONTEXT_ISSUES) || 5;
  }

  /**
   * Get contextual help for issue reporting
   */
  async getContextualHelp(userQuery, filters = {}) {
    console.log("🤖 [RAG] Processing query:", userQuery);

    // Step 1: Retrieve similar issues
    const similarIssues = await this.retrieveSimilarIssues(userQuery, filters);

    // Step 2: Build context
    const context = this.buildContext(similarIssues);

    // Step 3: Generate response
    const aiResponse = await this.generateResponse(userQuery, context, filters);

    // Step 4: Extract structured data
    const structured = await this.extractStructuredData(
      aiResponse,
      similarIssues
    );

    return {
      answer: aiResponse,
      structured,
      similarCases: similarIssues.slice(0, 3).map(this.formatIssueForResponse),
      confidence: this.calculateConfidence(similarIssues),
    };
  }

  /**
   * Retrieve similar issues from database
   */
  async retrieveSimilarIssues(query, filters = {}) {
    // Build search query
    const searchQuery = {
      status: { $in: ["resolved", "in-progress"] },
      ...(filters.category && { category: filters.category }),
      ...(filters.location?.city && { "location.city": filters.location.city }),
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    const issues = await Issue.find(searchQuery)
      .populate("reportedBy", "username")
      .populate("assignedTo", "username officialDetails.department")
      .sort({ createdAt: -1 })
      .limit(this.maxContextIssues * 2)
      .lean();

    // Score and rank issues by relevance
    const scoredIssues = issues.map((issue) => ({
      ...issue,
      relevanceScore: this.calculateRelevanceScore(issue, query, filters),
    }));

    scoredIssues.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredIssues.slice(0, this.maxContextIssues);
  }

  /**
   * Calculate relevance score for an issue
   */
  calculateRelevanceScore(issue, query, filters) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = issue.title.toLowerCase();
    const descLower = issue.description.toLowerCase();

    // Title match (0-40 points)
    if (titleLower.includes(queryLower)) score += 40;
    else if (queryLower.split(" ").some((word) => titleLower.includes(word)))
      score += 20;

    // Description match (0-30 points)
    if (descLower.includes(queryLower)) score += 30;
    else if (queryLower.split(" ").some((word) => descLower.includes(word)))
      score += 15;

    // Category match (0-15 points)
    if (filters.category && issue.category === filters.category) score += 15;

    // Location match (0-10 points)
    if (
      filters.location?.city &&
      issue.location?.city === filters.location.city
    )
      score += 10;

    // Resolution bonus (0-5 points)
    if (issue.status === "resolved") score += 5;

    return score;
  }

  /**
   * Build context from similar issues
   */
  buildContext(issues) {
    if (issues.length === 0) {
      return "No similar cases found in the database.";
    }

    return issues
      .map((issue, idx) => {
        const resolutionTime = this.calculateResolutionTime(issue);
        const department =
          issue.assignedTo?.officialDetails?.department ||
          "Municipal Department";

        return `
### Case ${idx + 1}: ${issue.title}
- **Category**: ${issue.category}
- **Priority**: ${issue.priority}
- **Status**: ${issue.status}
- **Location**: ${issue.location?.city || "N/A"}, ${
          issue.location?.state || "N/A"
        }
- **Department**: ${department}
- **Resolution Time**: ${resolutionTime}
- **Description**: ${issue.description.substring(0, 150)}...
- **Upvotes**: ${issue.upvotes?.length || 0}
      `.trim();
      })
      .join("\n\n---\n\n");
  }

  /**
   * Generate AI response
   */
  async generateResponse(userQuery, context, filters) {
    const systemPrompt = `You are an expert civic engagement assistant for CitizenVoice, a platform that helps citizens report and track municipal issues.

Your role is to:
1. Analyze the user's issue description
2. Reference similar past cases to provide informed guidance
3. Suggest optimal reporting strategies
4. Set realistic expectations for resolution times
5. Encourage civic participation

Be empathetic, informative, and actionable. Always maintain a professional yet friendly tone.`;

    const userPrompt = `A citizen is asking for help with this issue:

**User Query**: "${userQuery}"
${filters.category ? `**Category**: ${filters.category}` : ""}
${
  filters.location?.city
    ? `**Location**: ${filters.location.city}, ${filters.location.state}`
    : ""
}

**Similar Past Cases**:
${context}

Based on the information above, provide comprehensive guidance that includes:
1. Whether they should proceed with reporting this issue
2. Expected resolution timeframe (based on similar cases)
3. Which department will likely handle it
4. Tips for creating an effective report (photos to include, details to add)
5. Any immediate actions they can take
6. Related issues they might want to check

Keep your response conversational, helpful, and around 250-300 words.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content;
  }

  /**
   * Extract structured data from AI response
   */
  async extractStructuredData(aiResponse, similarIssues) {
    const extractionPrompt = `Based on this assistance response, extract structured data in JSON format:

Response: "${aiResponse}"

Extract:
{
  "shouldReport": boolean,
  "expectedResolutionDays": number (estimate),
  "suggestedDepartment": string,
  "suggestedPriority": "low" | "medium" | "high",
  "keyTips": string[] (2-4 actionable tips),
  "confidence": "low" | "medium" | "high"
}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Calculate resolution time
   */
  calculateResolutionTime(issue) {
    if (issue.status !== "resolved") {
      const daysSince = Math.floor(
        (Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24)
      );
      return `Ongoing (${daysSince} days)`;
    }

    const days = Math.floor(
      (new Date(issue.updatedAt) - new Date(issue.createdAt)) /
        (1000 * 60 * 60 * 24)
    );
    return `${days} days`;
  }

  /**
   * Format issue for response
   */
  formatIssueForResponse(issue) {
    return {
      id: issue._id,
      issueId: issue.issueId,
      title: issue.title,
      category: issue.category,
      status: issue.status,
      priority: issue.priority,
      location: {
        city: issue.location?.city,
        state: issue.location?.state,
      },
      department: issue.assignedTo?.officialDetails?.department || "N/A",
      resolutionTime: this.calculateResolutionTime(issue),
      upvotes: issue.upvotes?.length || 0,
    };
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(similarIssues) {
    if (similarIssues.length === 0) return "low";
    if (similarIssues.length >= 3 && similarIssues[0].relevanceScore > 50)
      return "high";
    if (similarIssues.length >= 2) return "medium";
    return "low";
  }

  /**
   * Get smart recommendations for community verification
   */
  async getVerificationRecommendations(userId) {
    const user = await User.findById(userId);

    // Get user's verification history
    const verificationHistory = await CommunityVerification.find({
      verifiedBy: userId,
    })
      .populate("issue")
      .limit(20)
      .lean();

    // Analyze preferences
    const categoryPrefs = {};
    verificationHistory.forEach((v) => {
      if (v.issue?.category) {
        categoryPrefs[v.issue.category] =
          (categoryPrefs[v.issue.category] || 0) + 1;
      }
    });

    // Find candidate issues
    const verifiedIds = verificationHistory
      .map((v) => v.issue?._id)
      .filter(Boolean);

    const candidates = await Issue.find({
      _id: { $nin: verifiedIds },
      status: { $in: ["reported", "acknowledged"] },
      verifiedCount: { $lt: 3 },
      ...(user.fullAddress?.city && { "location.city": user.fullAddress.city }),
    })
      .populate("reportedBy", "username")
      .limit(50)
      .lean();

    // Score each candidate
    const scored = candidates.map((issue) => ({
      issue,
      score: this.scoreVerificationCandidate(issue, user, categoryPrefs),
    }));

    scored.sort((a, b) => b.score - a.score);

    return {
      highPriority: scored.slice(0, 5).map((s) => ({
        ...s.issue,
        relevanceScore: s.score,
        reason: this.generateRecommendationReason(s.issue, user, categoryPrefs),
      })),
      inYourArea: scored
        .filter((s) => s.issue.location?.city === user.fullAddress?.city)
        .slice(0, 10),
      trending: scored.filter((s) => this.isRecent(s.issue, 7)).slice(0, 10),
    };
  }

  scoreVerificationCandidate(issue, user, categoryPrefs) {
    let score = 0;

    // Category preference (0-30)
    score += (categoryPrefs[issue.category] || 0) * 3;

    // Priority (0-20)
    if (issue.priority === "high") score += 20;
    else if (issue.priority === "medium") score += 10;
    else score += 5;

    // Location match (0-30)
    if (issue.location?.city === user.fullAddress?.city) score += 30;
    else if (issue.location?.state === user.fullAddress?.state) score += 15;

    // Recency (0-20)
    const daysSince = Math.floor(
      (Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < 3) score += 20;
    else if (daysSince < 7) score += 10;
    else score += 5;

    return Math.min(score, 100);
  }

  generateRecommendationReason(issue, user, categoryPrefs) {
    const reasons = [];

    if (categoryPrefs[issue.category]) {
      reasons.push(`You often verify ${issue.category} issues`);
    }
    if (issue.location?.city === user.fullAddress?.city) {
      reasons.push("In your area");
    }
    if (issue.priority === "high") {
      reasons.push("High priority");
    }
    if (this.isRecent(issue, 3)) {
      reasons.push("Recently reported");
    }

    return reasons.join(" • ") || "Recommended for you";
  }

  isRecent(issue, days) {
    const daysSince = Math.floor(
      (Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24)
    );
    return daysSince < days;
  }
}

export const ragService = new RAGService();
export default ragService;
