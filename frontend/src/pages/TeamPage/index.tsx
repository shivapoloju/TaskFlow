import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, UserPlus, Trash2, Mail, Crown, ShieldAlert, UserCheck } from 'lucide-react';
import { apiStatusConstants, ApiStatus } from '../../constants/apiStatus';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import LoadingView from '../../components/LoadingView';
import FailureView from '../../components/FailureView';
import TeamModal from '../../components/TeamModal';
import { Team, TeamMember, User as UserType } from '../../types';

const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>(apiStatusConstants.initial);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'Manager' | 'Member'>('Member');

  const fetchTeamsData = async () => {
    setApiStatus(apiStatusConstants.inProgress);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        apiFetch('/teams'),
        apiFetch('/auth/users')
      ]);

      const fetchedTeams: Team[] = teamsRes.data.teams || [];
      setTeams(fetchedTeams);
      setAllUsers(usersRes.data.users || []);

      if (fetchedTeams.length > 0 && !selectedTeam) {
        fetchTeamMembers(fetchedTeams[0]);
      } else if (selectedTeam) {
        fetchTeamMembers(selectedTeam);
      } else {
        setApiStatus(apiStatusConstants.success);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch teams');
      setApiStatus(apiStatusConstants.failure);
    }
  };

  const fetchTeamMembers = async (team: Team) => {
    setSelectedTeam(team);
    try {
      const res = await apiFetch(`/teams/${team.id}`);
      setTeamMembers(res.data.members || []);
      setApiStatus(apiStatusConstants.success);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch team members');
      setApiStatus(apiStatusConstants.failure);
    }
  };

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const handleCreateTeam = async (teamData: { name: string; description: string }) => {
    await apiFetch('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
    fetchTeamsData();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUserId) return;

    try {
      await apiFetch(`/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: Number(selectedUserId), role: selectedMemberRole })
      });
      setIsAddMemberOpen(false);
      setSelectedUserId('');
      fetchTeamMembers(selectedTeam);
    } catch (err: any) {
      alert(err.message || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!selectedTeam) return;
    if (!window.confirm('Remove member from this team?')) return;
    try {
      await apiFetch(`/teams/${selectedTeam.id}/members/${memberUserId}`, { method: 'DELETE' });
      fetchTeamMembers(selectedTeam);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  // Role distribution metrics
  const adminCount = teamMembers.filter(m => m.role === 'Admin').length;
  const managerCount = teamMembers.filter(m => m.role === 'Manager').length;
  const memberCount = teamMembers.filter(m => m.role === 'Member').length;

  const renderSuccessView = () => {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Team Structure & Governance</h1>
            <p className="page-subtitle">Organize engineering squads, role authorizations, and project allocations.</p>
          </div>
          {isManagerOrAdmin && (
            <button type="button" className="btn btn-primary" onClick={() => setIsTeamModalOpen(true)}>
              <Plus size={18} />
              <span>Create Team</span>
            </button>
          )}
        </div>

        <div className="team-layout-grid">
          {/* Teams Sidebar Column */}
          <div className="teams-list-card glass-card">
            <h3 className="card-subtitle">Teams Directory ({teams.length})</h3>
            <div className="teams-vertical-list">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`team-item-box ${selectedTeam?.id === team.id ? 'active' : ''}`}
                  onClick={() => fetchTeamMembers(team)}
                >
                  <div className="team-item-name">{team.name}</div>
                  <div className="team-item-desc">{team.description || 'General engineering squad'}</div>
                  <div className="team-item-footer">
                    <span>{team.member_count || 0} Members</span>
                    <span>{team.project_count || 0} Active Projects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Team Members & Governance */}
          <div className="team-details-card glass-card">
            {selectedTeam ? (
              <>
                <div className="team-details-header">
                  <div>
                    <h2>{selectedTeam.name}</h2>
                    <p className="text-muted">{selectedTeam.description || 'No description provided.'}</p>
                  </div>
                  {isManagerOrAdmin && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                    >
                      <UserPlus size={16} />
                      <span>Add Member</span>
                    </button>
                  )}
                </div>

                {/* Role Governance Distribution Banner */}
                <div className="governance-stats-banner">
                  <div className="gov-stat-item">
                    <Crown size={20} className="text-purple-400" />
                    <div>
                      <span className="font-bold text-lg">{adminCount}</span>
                      <span className="block text-xs text-muted">Admin Role</span>
                    </div>
                  </div>
                  <div className="gov-stat-item">
                    <ShieldAlert size={20} className="text-blue-400" />
                    <div>
                      <span className="font-bold text-lg">{managerCount}</span>
                      <span className="block text-xs text-muted">Manager Role</span>
                    </div>
                  </div>
                  <div className="gov-stat-item">
                    <UserCheck size={20} className="text-teal-400" />
                    <div>
                      <span className="font-bold text-lg">{memberCount}</span>
                      <span className="block text-xs text-muted">Member Role</span>
                    </div>
                  </div>
                </div>

                {isAddMemberOpen && (
                  <form onSubmit={handleAddMember} className="add-member-form glass-card margin-bottom-md">
                    <h4>Add User to Team</h4>
                    <div className="form-row">
                      <div className="form-group half">
                        <label>Select User</label>
                        <select
                          className="form-control"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(Number(e.target.value))}
                          required
                        >
                          <option value="">Choose User...</option>
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group half">
                        <label>Assigned Role</label>
                        <select
                          className="form-control"
                          value={selectedMemberRole}
                          onChange={(e) => setSelectedMemberRole(e.target.value as any)}
                        >
                          <option value="Member">Member</option>
                          <option value="Manager">Manager</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-actions-right">
                      <button type="button" className="btn btn-secondary" onClick={() => setIsAddMemberOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Confirm Member
                      </button>
                    </div>
                  </form>
                )}

                <h3 className="section-title">Assigned Squad Members ({teamMembers.length})</h3>
                <div className="members-grid">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="member-card glass-card hover-lift">
                      <img
                        src={
                          member.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            member.name
                          )}&background=6366f1&color=fff`
                        }
                        alt={member.name}
                        className="member-avatar"
                      />
                      <div className="member-info">
                        <h4 className="member-name">{member.name}</h4>
                        <div className="member-email">
                          <Mail size={12} />
                          <span>{member.email}</span>
                        </div>
                        <span className={`role-badge role-${member.role.toLowerCase()}`}>
                          <Shield size={10} /> {member.role}
                        </span>
                      </div>

                      {user?.role === 'Admin' && (
                        <button
                          type="button"
                          className="icon-action-btn danger member-remove-btn"
                          onClick={() => handleRemoveMember(member.user_id)}
                          title="Remove from team"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-data-text">Select a team from the directory list to view assigned members.</p>
            )}
          </div>
        </div>

        <TeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          onSave={handleCreateTeam}
        />
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.inProgress:
        return <LoadingView message="Loading teams & governance structure..." />;
      case apiStatusConstants.failure:
        return <FailureView message={errorMessage} onRetry={fetchTeamsData} />;
      case apiStatusConstants.success:
        return renderSuccessView();
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default TeamPage;
