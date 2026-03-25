import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Team } from '../types';
import { Presentation, Shield, Lock, ClipboardList, Info, Star, Activity } from 'lucide-react';

export default function PresenterView() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!teamId) return;
    const unsubscribe = onSnapshot(doc(db, 'teams', teamId), (doc) => {
      if (doc.exists()) {
        setTeam({ id: doc.id, ...doc.data() } as Team);
      }
    });
    return () => unsubscribe();
  }, [teamId]);

  if (!team) return <div className="p-8 text-center text-secondary">Loading Presenter View...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      <div className="flex justify-between items-end border-b border-line pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Presenter View</h1>
          <p className="text-sm text-secondary">Team: {team.name}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-line rounded-full text-xs font-medium text-secondary shadow-sm">
          <Lock size={14} />
          Content Locked
        </div>
      </div>

      {!team.lockedContent ? (
        <div className="p-20 border border-dashed border-line rounded-xl text-center text-secondary bg-surface/50">
          No content locked yet. Wait for your team to lock the case.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-primary flex items-center gap-2">
                <ClipboardList size={16} className="text-brand" />
                Findings
              </h2>
              <div className="apple-card min-h-[150px] text-primary whitespace-pre-wrap">
                {team.lockedContent.findings || <span className="text-secondary italic">No findings recorded.</span>}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium text-primary flex items-center gap-2">
                <Shield size={16} className="text-brand" />
                Differential
              </h2>
              <div className="apple-card min-h-[150px] text-primary whitespace-pre-wrap">
                {team.lockedContent.differential || <span className="text-secondary italic">No differential recorded.</span>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-primary flex items-center gap-2">
                <Star size={16} className="text-brand" />
                Top Diagnosis
              </h2>
              <div className="apple-card bg-brand/5 border-brand/20 text-xl font-semibold text-brand">
                {team.lockedContent.topDiagnosis || <span className="text-brand/50 italic text-base font-normal">No diagnosis recorded.</span>}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium text-primary flex items-center gap-2">
                <Activity size={16} className="text-brand" />
                Management / Next Study
              </h2>
              <div className="apple-card min-h-[150px] text-primary whitespace-pre-wrap">
                {team.lockedContent.management || <span className="text-secondary italic">No management recorded.</span>}
              </div>
            </div>

            <div className="apple-card bg-surface/50 space-y-4">
              <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                <Info size={16} className="text-secondary" />
                Presentation Tips
              </h3>
              <ul className="text-sm text-secondary space-y-2 list-disc pl-4">
                <li>Present faithfully but naturally from the lock.</li>
                <li>Be concise and organized.</li>
                <li>Communicate with confidence.</li>
                <li>Avoid reading verbatim if possible.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
