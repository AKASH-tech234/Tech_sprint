import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Trash2, MessageSquare, X, Send, 
  Mail, Phone, Briefcase, Activity, CheckCircle2
} from 'lucide-react';
import { issueService } from '../../../services/issueService';
import { useAuth } from '../../../context/AuthContext';

const TeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'field-officer',
    department: ''
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await issueService.getTeamMembers();
      setMembers(response.data?.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const response = await issueService.addTeamMember(newMember);
      setMembers([...members, response.data.member]);
      setShowAddModal(false);
      setNewMember({ name: '', email: '', phone: '', role: 'field-officer', department: '' });
      
      if (response.data.member.tempPassword) {
        alert(`Team member added!\n\nTemp Password: ${response.data.member.tempPassword}\n\nShare this securely.`);
      }
    } catch (error) {
      alert(error.message || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this team member? This will delete their account and unassign all issues.')) return;

    try {
      await issueService.removeTeamMember(memberId);
      setMembers(members.filter(m => m._id !== memberId));
    } catch (error) {
      alert(error.message || 'Failed to remove team member');
    }
  };

  const openMessageModal = async (member) => {
    setSelectedMember(member);
    setShowMessageModal(true);
    try {
      const response = await issueService.getMessages(member._id);
      setMessages(response.data?.messages || []);
      await issueService.markMessagesRead(member._id);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await issueService.sendMessageToMember(selectedMember._id, newMessage);
      const response = await issueService.getMessages(selectedMember._id);
      setMessages(response.data?.messages || []);
      setNewMessage('');
    } catch (error) {
      alert(error.message || 'Failed to send message');
    }
  };

  if (!user?.isOfficialAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
          <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">Only team leaders can access team management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8" />
              Team Management
            </h1>
            <p className="text-gray-300 mt-2">Manage your team members and communications</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add Member
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4">Loading...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Team Members</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-300">{member.role}</p>
                    </div>
                  </div>
                  {member.unreadMessages > 0 && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                      {member.unreadMessages}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </div>
                  )}
                  {member.department && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {member.department}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs">Assigned</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{member.stats?.assigned || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">Done</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{member.stats?.completed || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openMessageModal(member)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-slate-800 rounded-2xl p-8 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add Team Member</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name*</label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email*</label>
                    <input
                      type="email"
                      required
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="field-officer">Field Officer</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="inspector">Inspector</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                    <input
                      type="text"
                      value={newMember.department}
                      onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="Roads & Infrastructure"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Modal */}
        <AnimatePresence>
          {showMessageModal && selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowMessageModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedMember.avatar}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedMember.name}</h2>
                      <p className="text-sm text-gray-400">{selectedMember.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-white/5 rounded-lg p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.from?.toString() === user.id?.toString() ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.from?.toString() === user.id?.toString()
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white/10 text-gray-200'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export { TeamManagement };
