export const issueSubmittedTemplate = (issue) => ({
  subject: "Complaint Received",
  html: `
    <h2>Complaint Submitted</h2>
    <p><b>ID:</b> ${issue._id}</p>
    <p><b>Title:</b> ${issue.title}</p>
    <p>Status: Pending</p>
  `,
});


export const issueAssignedTemplate = (issue) => ({
  subject: "New Issue Assigned",
  html: `
    <h2>New Issue Assigned</h2>
    <p>Issue: <b>${issue.title}</b></p>
    <p>Please start working on it.</p>
  `,
});

export const issueSolvedTemplate = (issue) => ({
  subject: "Issue Marked as Solved",
  html: `
    <h2>Issue Solved</h2>
    <p>The issue <b>${issue.title}</b> has been solved.</p>
  `,
});
