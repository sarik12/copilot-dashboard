import React, { useState } from 'react';
import { Users, UserPlus, Settings } from 'lucide-react';

export const TeamManagement = ({ members, teams, onTeamUpdate }) => {
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleCreateTeam = (teamData) => {
    onTeamUpdate([...teams, teamData]);
    setShowTeamModal(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Management
        </h3>
        <button
          onClick={() => setShowTeamModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <UserPlus className="h-4 w-4" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <div key={team.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{team.name}</h4>
              <button
                onClick={() => setSelectedTeam(team)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {team.members.map(member => (
                <div key={member.login} className="flex items-center gap-2">
                  <img
                    src={member.avatar_url}
                    alt={member.login}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm">{member.login}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Team Creation Modal */}
      {showTeamModal && (
        <TeamModal
          onClose={() => setShowTeamModal(false)}
          onSave={handleCreateTeam}
          availableMembers={members}
        />
      )}

      {/* Team Edit Modal */}
      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onSave={(updatedTeam) => {
            onTeamUpdate(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
            setSelectedTeam(null);
          }}
          availableMembers={members}
        />
      )}
    </div>
  );
};

const TeamModal = ({ team, onClose, onSave, availableMembers }) => {
  const [name, setName] = useState(team?.name || '');
  const [selectedMembers, setSelectedMembers] = useState(team?.members || []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h4 className="text-lg font-bold mb-4">
          {team ? 'Edit Team' : 'Create New Team'}
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Members</label>
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {availableMembers.map(member => (
                <label key={member.login} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedMembers.some(m => m.login === member.login)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(m => m.login !== member.login));
                      }
                    }}
                  />
                  <img
                    src={member.avatar_url}
                    alt={member.login}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm">{member.login}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({
              id: team?.id || Date.now(),
              name,
              members: selectedMembers
            })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {team ? 'Save Changes' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
};