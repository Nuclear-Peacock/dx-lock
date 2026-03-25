import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { UserProfile, Session, Case } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Settings, ClipboardList, Trash2, Edit3, Activity, Layers, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface EducatorDashboardProps {
  profile: UserProfile;
}

export default function EducatorDashboard({ profile }: EducatorDashboardProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch Sessions
    const sq = query(collection(db, 'sessions'), where('educatorId', '==', profile.uid));
    const unsubscribeSessions = onSnapshot(sq, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessions(sessionList);
    });

    // Fetch Cases
    const cq = query(collection(db, 'cases'), where('authorId', '==', profile.uid));
    const unsubscribeCases = onSnapshot(cq, (snapshot) => {
      const caseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
      setCases(caseList);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeCases();
    };
  }, [profile.uid]);

  const createSession = async () => {
    const newSession: Partial<Session> = {
      name: `Session ${new Date().toLocaleDateString()}`,
      educatorId: profile.uid,
      status: 'setup',
      currentCaseIndex: 0,
      currentRevealIndex: 0,
      isSubmissionOpen: false,
      isTeamLockOpen: false,
      caseIds: [],
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'sessions'), newSession);
    navigate(`/educator/session/${docRef.id}`);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteDoc(doc(db, 'sessions', id));
    }
  };

  const deleteCase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this case?')) {
      await deleteDoc(doc(db, 'cases', id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-line pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand text-sm font-semibold">
            <Activity size={16} /> Educator Dashboard
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">
            Overview
          </h1>
          <p className="text-sm text-text-secondary">Manage your clinical simulations and case library.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/educator/case/new')}
            className="btn-secondary flex-1 md:flex-none"
          >
            <Plus size={18} />
            New Case
          </button>
          <button
            onClick={createSession}
            className="btn-primary flex-1 md:flex-none"
          >
            <Plus size={18} />
            New Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sessions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Active Sessions</h2>
            <span className="badge badge-gray">{sessions.length}</span>
          </div>
          
          {sessions.length === 0 ? (
            <div className="apple-card p-12 text-center bg-gray-50 border-dashed">
              <p className="text-sm text-text-secondary">No active sessions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={session.id} 
                  className="apple-card group p-5 hover:shadow-md transition-all cursor-pointer bg-white"
                  onClick={() => navigate(`/educator/session/${session.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-text-primary group-hover:text-brand transition-colors">{session.name}</p>
                      <div className="flex gap-3">
                        <span className={`badge ${session.status === 'active' ? 'badge-green' : session.status === 'setup' ? 'badge-gray' : 'badge-blue'} capitalize`}>
                          {session.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-text-secondary text-xs font-medium">
                          <Layers size={14} />
                          <span>{session.caseIds.length} Cases</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-brand hover:bg-brand/10 rounded-full transition-colors">
                        <Play size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Case Library Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Case Library</h2>
            <span className="badge badge-gray">{cases.length}</span>
          </div>
          
          {cases.length === 0 ? (
            <div className="apple-card p-12 text-center bg-gray-50 border-dashed">
              <p className="text-sm text-text-secondary">Your case library is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={c.id} 
                  className="apple-card group p-5 hover:shadow-md transition-all cursor-pointer bg-white"
                  onClick={() => navigate(`/educator/case/${c.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary group-hover:text-brand transition-colors">{c.title}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-text-secondary font-medium">{c.reveals.length} Reveals</span>
                          <span className="text-xs text-text-secondary truncate max-w-[150px]">
                            {c.correctDiagnosis || 'No Diagnosis'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => deleteCase(c.id, e)}
                        className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-text-secondary hover:text-brand hover:bg-brand/10 rounded-full transition-colors">
                        <Edit3 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
