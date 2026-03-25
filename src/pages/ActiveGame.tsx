import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Session, Case, UserProfile, Team, Submission } from '../types';
import { CARDIAC_AMYLOID_CASE } from '../data/sampleCase';
import { Send, Lock, Unlock, Users, MessageSquare, ClipboardList, Info } from 'lucide-react';

interface ActiveGameProps {
  profile: UserProfile;
}

export default function ActiveGame({ profile }: ActiveGameProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentCase, setCurrentCase] = useState<Case>(CARDIAC_AMYLOID_CASE);
  const [individualAnswer, setIndividualAnswer] = useState('');
  const [teamLock, setTeamLock] = useState({
    findings: '',
    differential: '',
    topDiagnosis: '',
    management: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
      if (doc.exists()) {
        setSession({ id: doc.id, ...doc.data() } as Session);
      }
    });

    const teamsQuery = query(collection(db, 'teams'), where('sessionId', '==', sessionId), where('memberIds', 'array-contains', profile.uid));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const teamData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Team;
        setTeam(teamData);
        if (teamData.lockedContent) {
          setTeamLock(teamData.lockedContent);
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeTeams();
    };
  }, [sessionId, profile.uid]);

  const submitIndividual = async () => {
    if (!session || !team || !individualAnswer.trim()) return;
    const submission: Partial<Submission> = {
      sessionId: session.id,
      caseId: currentCase.id,
      userId: profile.uid,
      teamId: team.id,
      content: individualAnswer,
      submittedAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'submissions'), submission);
    setIndividualAnswer('');
    alert('Individual submission sent!');
  };

  const updateTeamLock = async (field: keyof typeof teamLock, value: string) => {
    if (!team || !session?.isTeamLockOpen) return;
    const newLock = { ...teamLock, [field]: value };
    setTeamLock(newLock);
    await updateDoc(doc(db, 'teams', team.id), {
      lockedContent: newLock
    });
  };

  const lockTeamContent = async () => {
    if (!team || !session?.isTeamLockOpen) return;
    await updateDoc(doc(db, 'teams', team.id), {
      lockedContent: { ...teamLock, revealLockedAt: session.currentRevealIndex }
    });
    alert('Team content locked!');
  };

  if (!session || !team) return <div className="p-8 text-center text-secondary">Loading Session...</div>;

  const currentReveal = currentCase.reveals[session.currentRevealIndex];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Reveal & Individual Submission */}
      <div className="lg:col-span-7 space-y-6">
        <div className="apple-card space-y-6">
          <div className="flex justify-between items-center border-b border-line pb-4">
            <h2 className="text-xl font-semibold tracking-tight text-primary">Reveal {session.currentRevealIndex + 1}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">Case: {currentCase.title}</span>
            </div>
          </div>
          
          <div className="aspect-video bg-background rounded-xl border border-line flex items-center justify-center relative group overflow-hidden">
            <img 
              src={currentReveal.url} 
              alt="Current Reveal" 
              className="max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity bg-surface/90 backdrop-blur-md p-4 rounded-lg border border-line shadow-sm">
              <div>
                <p className="text-xs font-medium text-secondary uppercase tracking-wider">Label</p>
                <p className="font-medium text-primary">{currentReveal.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-secondary uppercase tracking-wider">Source</p>
                <p className="text-sm text-primary">{currentReveal.attribution}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-line">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-primary">Individual Submission</h3>
              {!session.isSubmissionOpen && <span className="badge badge-red">Window Closed</span>}
            </div>
            <textarea
              disabled={!session.isSubmissionOpen}
              value={individualAnswer}
              onChange={(e) => setIndividualAnswer(e.target.value)}
              placeholder="Enter your observations..."
              className="input-field w-full h-32 resize-none"
            />
            <button
              disabled={!session.isSubmissionOpen || !individualAnswer.trim()}
              onClick={submitIndividual}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Send size={18} />
              Submit Observations
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Team Lock */}
      <div className="lg:col-span-5 space-y-6">
        <div className="apple-card space-y-6 border-brand/30 bg-brand/5">
          <div className="flex justify-between items-center border-b border-brand/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                <Users size={18} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-brand">Team Lock: {team.name}</h2>
            </div>
            {session.isTeamLockOpen ? (
              <span className="badge badge-blue">Open</span>
            ) : (
              <span className="badge badge-gray">Closed</span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary">Findings</label>
              <textarea
                disabled={!session.isTeamLockOpen}
                value={teamLock.findings}
                onChange={(e) => updateTeamLock('findings', e.target.value)}
                className="input-field w-full h-24 resize-none"
                placeholder="Key imaging findings..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary">Differential</label>
              <textarea
                disabled={!session.isTeamLockOpen}
                value={teamLock.differential}
                onChange={(e) => updateTeamLock('differential', e.target.value)}
                className="input-field w-full h-24 resize-none"
                placeholder="Differential diagnosis..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary">Top Diagnosis</label>
              <input
                disabled={!session.isTeamLockOpen}
                value={teamLock.topDiagnosis}
                onChange={(e) => updateTeamLock('topDiagnosis', e.target.value)}
                className="input-field w-full"
                placeholder="Most likely diagnosis..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary">Management / Next Study</label>
              <textarea
                disabled={!session.isTeamLockOpen}
                value={teamLock.management}
                onChange={(e) => updateTeamLock('management', e.target.value)}
                className="input-field w-full h-24 resize-none"
                placeholder="Recommended next steps..."
              />
            </div>

            <button
              disabled={!session.isTeamLockOpen}
              onClick={lockTeamContent}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
            >
              <Lock size={18} />
              Lock Team Content
            </button>
          </div>
        </div>

        <div className="apple-card space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info size={16} className="text-secondary" />
            <h3 className="text-sm font-medium">Team Members</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {team.memberIds.map(id => (
              <div key={id} className="px-3 py-1.5 bg-surface border border-line rounded-full text-xs font-medium text-secondary">
                User {id.slice(0, 4)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
