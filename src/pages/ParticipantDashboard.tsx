import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, arrayUnion, doc, getDocs } from 'firebase/firestore';
import { UserProfile, Session, Team } from '../types';
import { useNavigate } from 'react-router-dom';
import { Users, Play, Plus, Search, ChevronRight } from 'lucide-react';

interface ParticipantDashboardProps {
  profile: UserProfile;
}

export default function ParticipantDashboard({ profile }: ParticipantDashboardProps) {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'sessions'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setActiveSessions(sessionList);
    });

    const teamsQuery = query(collection(db, 'teams'), where('memberIds', 'array-contains', profile.uid));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setMyTeams(teamList);
    });

    return () => {
      unsubscribe();
      unsubscribeTeams();
    };
  }, [profile.uid]);

  const createTeam = async (sessionId: string) => {
    if (!newTeamName.trim()) return;
    const newTeam: Partial<Team> = {
      sessionId,
      name: newTeamName,
      memberIds: [profile.uid],
      lockedContent: undefined
    };
    await addDoc(collection(db, 'teams'), newTeam);
    setNewTeamName('');
    navigate(`/participant/session/${sessionId}`);
  };

  const joinTeam = async (teamId: string, sessionId: string) => {
    await updateDoc(doc(db, 'teams', teamId), {
      memberIds: arrayUnion(profile.uid)
    });
    navigate(`/participant/session/${sessionId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div className="flex justify-between items-end border-b border-line pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Participant Dashboard</h1>
          <p className="text-sm text-secondary">Join a Session & Team</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-primary">Active Sessions</h2>
        
        {activeSessions.length === 0 ? (
          <div className="p-12 border border-dashed border-line rounded-xl text-center text-secondary bg-surface/50">
            No active sessions found. Wait for an educator to start one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeSessions.map(session => (
              <div key={session.id} className="apple-card space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-xl font-medium text-primary">{session.name}</p>
                  <span className="badge badge-green">Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-line">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-primary">Create New Team</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Team Name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="input-field flex-1"
                      />
                      <button 
                        onClick={() => createTeam(session.id)}
                        className="btn-primary px-3"
                        disabled={!newTeamName.trim()}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-primary">Join Existing Team</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      <TeamList sessionId={session.id} onJoin={(teamId) => joinTeam(teamId, session.id)} currentUserId={profile.uid} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-primary">Your Active Teams</h2>
        
        {myTeams.length === 0 ? (
          <div className="p-8 border border-dashed border-line rounded-xl text-center text-secondary bg-surface/50">
            You haven't joined any teams yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {myTeams.map(team => (
              <div 
                key={team.id} 
                className="apple-card flex items-center justify-between group cursor-pointer hover:border-brand transition-all"
                onClick={() => navigate(`/participant/session/${team.sessionId}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{team.name}</p>
                    <p className="text-sm text-secondary">Session: {activeSessions.find(s => s.id === team.sessionId)?.name || 'Unknown'}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-secondary group-hover:text-brand transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamList({ sessionId, onJoin, currentUserId }: { sessionId: string, onJoin: (id: string) => void, currentUserId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'teams'), where('sessionId', '==', sessionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamList.filter(t => !t.memberIds.includes(currentUserId)));
    });
    return () => unsubscribe();
  }, [sessionId, currentUserId]);

  if (teams.length === 0) return <p className="text-sm text-secondary italic">No other teams yet...</p>;

  return (
    <>
      {teams.map(team => (
        <button
          key={team.id}
          onClick={() => onJoin(team.id)}
          className="w-full text-left p-3 rounded-lg border border-line bg-surface hover:border-brand hover:bg-brand/5 transition-colors flex justify-between items-center group"
        >
          <span className="font-medium text-primary">{team.name}</span>
          <span className="text-xs font-medium text-brand opacity-0 group-hover:opacity-100 transition-opacity">JOIN</span>
        </button>
      ))}
    </>
  );
}
