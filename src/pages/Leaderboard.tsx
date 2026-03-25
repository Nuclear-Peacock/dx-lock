import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDocs } from 'firebase/firestore';
import { Score, Session, Team, UserProfile } from '../types';
import { Trophy, Medal, Star, Users, User } from 'lucide-react';

export default function Leaderboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [scores, setScores] = useState<Score[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribeSession = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
      if (doc.exists()) {
        setSession({ id: doc.id, ...doc.data() } as Session);
      }
    });

    const q = query(collection(db, 'scores'), where('sessionId', '==', sessionId), orderBy('totalScore', 'desc'));
    const unsubscribeScores = onSnapshot(q, async (snapshot) => {
      const scoreList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Score));
      setScores(scoreList);

      // Fetch user profiles for individual scores
      const individualScores = scoreList.filter(s => s.targetType === 'individual');
      const profiles: Record<string, UserProfile> = { ...userProfiles };
      for (const score of individualScores) {
        if (!profiles[score.targetId]) {
          const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', score.targetId)));
          if (!userSnap.empty) {
            profiles[score.targetId] = userSnap.docs[0].data() as UserProfile;
          }
        }
      }
      setUserProfiles(profiles);
    });

    const teamsQuery = query(collection(db, 'teams'), where('sessionId', '==', sessionId));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamList);
    });

    return () => {
      unsubscribeSession();
      unsubscribeScores();
      unsubscribeTeams();
    };
  }, [sessionId]);

  const getTargetName = (score: Score) => {
    if (score.targetType === 'team') {
      return teams.find(t => t.id === score.targetId)?.name || 'Unknown Team';
    }
    const profile = userProfiles[score.targetId];
    return profile?.displayAlias || `User ${score.targetId.slice(0, 4)}`;
  };

  if (!session) return <div className="p-8 text-center text-secondary">Loading Leaderboard...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      <div className="text-center space-y-2 pb-8 border-b border-line">
        <h1 className="text-4xl font-semibold tracking-tight text-primary">{session.name}</h1>
        <p className="text-sm text-secondary uppercase tracking-wider font-medium">Final Leaderboard & Scores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Leaderboard */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary border-b border-line pb-2">
            <Users size={20} className="text-brand" />
            <h2 className="text-lg font-medium">Team Rankings</h2>
          </div>
          
          <div className="space-y-3">
            {scores.filter(s => s.targetType === 'team').map((score, idx) => (
              <div key={score.id} className="apple-card flex justify-between items-center group hover:border-brand transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-surface text-secondary'}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-primary text-lg">{getTargetName(score)}</p>
                    <div className="flex gap-3 text-xs text-secondary mt-1">
                      <span>Content: {score.teamContentScore}</span>
                      <span>Hot Seat: {score.hotSeatScore}</span>
                      <span className="text-brand font-medium">Bonus: +{score.lockBonus}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-brand">{score.totalScore.toFixed(1)}</p>
                  <p className="text-xs text-secondary uppercase tracking-wider">Total Points</p>
                </div>
              </div>
            ))}
            {scores.filter(s => s.targetType === 'team').length === 0 && (
              <div className="p-8 border border-dashed border-line rounded-xl text-center text-secondary bg-surface/50">
                No team scores recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Individual Leaderboard */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary border-b border-line pb-2">
            <User size={20} className="text-zinc-500" />
            <h2 className="text-lg font-medium">Individual Rankings</h2>
          </div>
          
          <div className="space-y-3">
            {scores.filter(s => s.targetType === 'individual').map((score, idx) => (
              <div key={score.id} className="apple-card flex justify-between items-center group hover:border-zinc-400 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-sm font-medium text-secondary">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-primary">{getTargetName(score)}</p>
                    <p className="text-xs text-secondary mt-1">Individual Score: {score.individualScore}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-primary">{score.totalScore.toFixed(1)}</p>
                  <p className="text-[10px] text-secondary uppercase tracking-wider">Total Points</p>
                </div>
              </div>
            ))}
            {scores.filter(s => s.targetType === 'individual').length === 0 && (
              <div className="p-8 border border-dashed border-line rounded-xl text-center text-secondary bg-surface/50">
                No individual scores recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-12 mt-12 border-t border-line flex justify-center">
        <div className="flex items-center gap-12">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto shadow-sm">
              <Trophy size={32} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider font-medium">Champion Team</p>
              <p className="font-semibold text-primary text-lg">{getTargetName(scores.find(s => s.targetType === 'team') || { targetId: 'N/A', targetType: 'team' } as Score)}</p>
            </div>
          </div>
          
          <div className="w-px h-24 bg-line"></div>
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center mx-auto shadow-sm">
              <Star size={32} className="text-brand" />
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider font-medium">Top Individual</p>
              <p className="font-semibold text-primary text-lg">{getTargetName(scores.find(s => s.targetType === 'individual') || { targetId: 'N/A', targetType: 'individual' } as Score)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
