export const isOfficialAdmin = (user) => {
  if (!user || user.role !== 'official') return false;

  const emailsRaw = process.env.OFFICIAL_ADMIN_EMAIL || process.env.OFFICIAL_ADMIN_EMAILS || '';
  const allowlistedEmails = emailsRaw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowlistedEmails.length > 0) {
    return allowlistedEmails.includes(String(user.email || '').toLowerCase());
  }

  return String(user.officialDetails?.designation || '').toLowerCase() === 'team-lead';
};

export const requireOfficialAdmin = (req, res, next) => {
  if (!isOfficialAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  }
  next();
};
