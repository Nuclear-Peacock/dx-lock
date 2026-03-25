import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { Session, Case, UserProfile, Team } from '../types';
import { CARDIAC_AMYLOID_CASE } from '../data/sampleCase';
import { Play, Pause, Lock, Unlock, ChevronRight, ChevronLeft, Users, Trophy, Eye, Settings, ListOrdered, Shuffle, Hash, Layers, Activity, RotateCcw, Shield, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SessionManagerProps {
  profile: UserProfile;
}

// Mock case library for now
const CASE_LIBRARY: Case[] = [
  CARDIAC_AMYLOID_CASE,
  {
    id: 'pulmonary-embolism-001',
    title: 'Pulmonary Embolism',
    authorId: 'system',
    reveals: [
      { type: 'image', url: 'https://picsum.photos/seed/pe1/800/600', label: 'CTPA Axial' },
      { type: 'image', url: 'https://picsum.photos/seed/pe2/800/600', label: 'CTPA Coronal' },
      { type: 'image', url: 'https://picsum.photos/seed/pe3/800/600', label: 'Chest X-ray' }
    ],
    correctDiagnosis: 'Pulmonary Embolism',
    management: 'Anticoagulation'
  },
  {
    id: 'brain-infarct-001',
    title: 'Acute MCA Infarct',
    authorId: 'system',
    reveals: [
      { type: 'image', url: 'https://picsum.photos/seed/brain1/800/600', label: 'CT Non-contrast' },
      { type: 'image', url: 'https://picsum.photos/seed/brain2/800/600', label: 'CTA Head' },
      { type: 'image', url: 'https://picsum.photos/seed/brain3/800/600', label: 'DWI MRI' }
    ],
    correctDiagnosis: 'Acute MCA Infarct',
    management: 'Thrombolysis/Thrombectomy'
  }
];

export default function SessionManager({ profile }: SessionManagerProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [availableCases, setAvailableCases] = useState<Case[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Session;
        setSession(data);
        
        // Find current case from Firestore
        if (data.caseIds.length > 0) {
          const caseId = data.caseIds[data.currentCaseIndex];
          const caseSnap = await getDoc(doc(db, 'cases', caseId));
          if (caseSnap.exists()) {
            setCurrentCase({ id: caseSnap.id, ...caseSnap.data() } as Case);
          }
        }
      }
    });

    const teamsQuery = query(collection(db, 'teams'), where('sessionId', '==', sessionId));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamList);
    });

    // Fetch all available cases for setup
    const fetchCases = async () => {
      const q = query(collection(db, 'cases'), where('authorId', '==', profile.uid));
      const snapshot = await getDocs(q);
      setAvailableCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case)));
    };
    fetchCases();

    return () => {
      unsubscribe();
      unsubscribeTeams();
    };
  }, [sessionId, profile.uid]);

  const updateSession = async (updates: Partial<Session>) => {
    if (!sessionId) return;
    await updateDoc(doc(db, 'sessions', sessionId), updates);
  };

  const toggleCaseSelection = (caseId: string) => {
    if (!session) return;
    const currentCaseIds = session.caseIds || [];
    const newCaseIds = currentCaseIds.includes(caseId)
      ? currentCaseIds.filter(id => id !== caseId)
      : [...currentCaseIds, caseId];
    updateSession({ caseIds: newCaseIds });
  };

  const updateConfig = (key: string, value: any) => {
    if (!session) return;
    const currentConfig = session.config || {
      caseCount: 1,
      revealCountPerCase: 3,
      revealOrder: 'sequential',
      caseOrder: 'sequential'
    };
    updateSession({ config: { ...currentConfig, [key]: value } });
  };

  const launchSession = () => {
    if (!session || session.caseIds.length === 0) return;
    updateSession({ 
      status: 'active',
      currentCaseIndex: 0,
      currentRevealIndex: 0
    });
  };

  const nextReveal = () => {
    if (!session || !currentCase) return;
    const maxReveals = Math.min(currentCase.reveals.length, session.config?.revealCountPerCase || currentCase.reveals.length);
    if (session.currentRevealIndex < maxReveals - 1) {
      updateSession({ currentRevealIndex: session.currentRevealIndex + 1 });
    } else if (session.currentCaseIndex < session.caseIds.length - 1) {
      updateSession({ 
        currentCaseIndex: session.currentCaseIndex + 1,
        currentRevealIndex: 0
      });
    }
  };

  const prevReveal = () => {
    if (!session) return;
    if (session.currentRevealIndex > 0) {
      updateSession({ currentRevealIndex: session.currentRevealIndex - 1 });
    } else if (session.currentCaseIndex > 0) {
      updateSession({ 
        currentCaseIndex: session.currentCaseIndex - 1,
        currentRevealIndex: 0
      });
    }
  };

  if (!session) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-brand animate-pulse font-medium">Initializing Session...</div>
    </div>
  );

  if (session.status === 'setup') {
    const config = session.config || {
      caseCount: session.caseIds.length,
      revealCountPerCase: 3,
      revealOrder: 'sequential',
      caseOrder: 'sequential'
    };

    return (
      <div className="max-w-6xl mx-auto p-8 space-y-8 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-line pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand text-sm font-semibold">
              <Settings size={16} /> Configuration Phase
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary">
              Session Setup
            </h1>
            <p className="text-sm text-text-secondary">{session.name}</p>
          </div>
          <button
            onClick={launchSession}
            disabled={session.caseIds.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Play size={18} />
            Launch Session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Case Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">Select Cases</h2>
              <span className="text-sm text-text-secondary">Selected: {session.caseIds.length}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCases.map((c, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={c.id}
                  onClick={() => toggleCaseSelection(c.id)}
                  className={`apple-card p-5 cursor-pointer transition-all group ${
                    session.caseIds.includes(c.id) 
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/20' 
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className={`font-semibold ${session.caseIds.includes(c.id) ? 'text-brand' : 'text-text-primary'}`}>{c.title}</p>
                      <p className="text-xs text-text-secondary">{c.reveals.length} Reveals Available</p>
                    </div>
                    {session.caseIds.includes(c.id) && (
                      <div className="w-6 h-6 bg-brand text-white font-semibold text-xs flex items-center justify-center rounded-full shadow-sm">
                        {session.caseIds.indexOf(c.id) + 1}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {availableCases.length === 0 && (
                <div className="col-span-full apple-card p-12 text-center bg-gray-50 border-dashed">
                  <p className="text-sm text-text-secondary mb-4">No cases found in library.</p>
                  <button 
                    onClick={() => navigate('/educator/case/new')}
                    className="text-brand text-sm font-medium hover:underline"
                  >
                    + Create New Case
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Sidebar */}
          <div className="space-y-6">
            <div className="apple-card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <Settings size={18} className="text-brand" />
                <h2 className="text-lg font-semibold text-text-primary">Parameters</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <ListOrdered size={16} className="text-text-secondary" /> Case Sequencing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateConfig('caseOrder', 'sequential')}
                      className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        config.caseOrder === 'sequential' ? 'border-brand text-brand bg-brand/5' : 'border-line text-text-secondary hover:border-gray-300 bg-white'
                      }`}
                    >
                      Sequential
                    </button>
                    <button 
                      onClick={() => updateConfig('caseOrder', 'random')}
                      className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        config.caseOrder === 'random' ? 'border-brand text-brand bg-brand/5' : 'border-line text-text-secondary hover:border-gray-300 bg-white'
                      }`}
                    >
                      Random
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <Hash size={16} className="text-text-secondary" /> Reveals Per Case
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-line">
                    <button 
                      onClick={() => updateConfig('revealCountPerCase', Math.max(1, config.revealCountPerCase - 1))}
                      className="p-1.5 text-text-secondary hover:text-brand hover:bg-white rounded-lg transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="flex-1 text-center font-semibold text-lg text-text-primary">{config.revealCountPerCase}</span>
                    <button 
                      onClick={() => updateConfig('revealCountPerCase', Math.min(10, config.revealCountPerCase + 1))}
                      className="p-1.5 text-text-secondary hover:text-brand hover:bg-white rounded-lg transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <Shuffle size={16} className="text-text-secondary" /> Reveal Ordering
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateConfig('revealOrder', 'sequential')}
                      className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        config.revealOrder === 'sequential' ? 'border-brand text-brand bg-brand/5' : 'border-line text-text-secondary hover:border-gray-300 bg-white'
                      }`}
                    >
                      Sequential
                    </button>
                    <button 
                      onClick={() => updateConfig('revealOrder', 'random')}
                      className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        config.revealOrder === 'random' ? 'border-brand text-brand bg-brand/5' : 'border-line text-text-secondary hover:border-gray-300 bg-white'
                      }`}
                    >
                      Random
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl">
              <div className="flex gap-3">
                <AlertCircle size={18} className="text-brand shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary leading-relaxed">
                  Launch will initialize the session for all connected participants. Ensure all cases are correctly configured before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 mt-16">
      {/* Active Session Header */}
      <div className="flex justify-between items-center apple-card p-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">
            <Activity size={24} className="text-brand" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">{session.name}</h1>
              <span className="badge badge-blue">Live Session</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Case {session.currentCaseIndex + 1} of {session.caseIds.length} • Reveal {session.currentRevealIndex + 1}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => updateSession({ status: 'setup' })}
            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            onClick={() => updateSession({ status: session.status === 'active' ? 'paused' : 'active' })}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            {session.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
            {session.status === 'active' ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Control Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="apple-card p-8 space-y-8">
            {currentCase ? (
              <>
                <div className="flex justify-between items-center border-b border-line pb-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Current Objective</p>
                    <h2 className="text-3xl font-bold text-text-primary">{currentCase.title}</h2>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-line">
                    <button 
                      onClick={prevReveal} 
                      disabled={session.currentRevealIndex === 0 && session.currentCaseIndex === 0}
                      className="p-2 text-text-secondary hover:text-brand hover:bg-white rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="text-center min-w-[100px]">
                      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Reveal</p>
                      <p className="text-lg font-bold text-brand">
                        {session.currentRevealIndex + 1} <span className="text-text-secondary text-sm font-medium">/</span> {Math.min(currentCase.reveals.length, session.config?.revealCountPerCase || currentCase.reveals.length)}
                      </p>
                    </div>
                    <button 
                      onClick={nextReveal} 
                      disabled={session.currentCaseIndex === session.caseIds.length - 1 && session.currentRevealIndex === Math.min(currentCase.reveals.length, session.config?.revealCountPerCase || currentCase.reveals.length) - 1}
                      className="p-2 text-text-secondary hover:text-brand hover:bg-white rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="aspect-video bg-gray-100 rounded-2xl border border-line flex items-center justify-center relative group overflow-hidden">
                  <AnimatePresence mode="wait">
                    {currentCase.reveals[session.currentRevealIndex] ? (
                      <motion.div
                        key={`${session.currentCaseIndex}-${session.currentRevealIndex}`}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img 
                          src={currentCase.reveals[session.currentRevealIndex].url} 
                          alt="Current Reveal" 
                          className="max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end bg-white/90 p-5 rounded-xl shadow-sm border border-line backdrop-blur-md transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Asset Label</p>
                            <p className="font-semibold text-lg text-text-primary">{currentCase.reveals[session.currentRevealIndex].label}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Source Attribution</p>
                            <p className="text-sm text-text-secondary">{currentCase.reveals[session.currentRevealIndex].attribution}</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-text-secondary">
                        <AlertCircle size={40} />
                        <p className="text-sm font-medium">Asset Data Corrupted or Missing</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="p-20 text-center space-y-6">
                <div className="w-16 h-16 bg-gray-50 rounded-full shadow-sm mx-auto flex items-center justify-center">
                  <Shield size={32} className="text-text-secondary" />
                </div>
                <div className="space-y-2">
                  <p className="text-text-primary font-semibold text-lg">No Active Objective</p>
                  <p className="text-text-secondary text-sm">Please select a case from the setup menu</p>
                </div>
                <button 
                  onClick={() => updateSession({ status: 'setup' })}
                  className="btn-secondary text-sm"
                >
                  Return to Setup
                </button>
              </div>
            )}

            {/* Global Controls */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-line">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-brand" />
                  <p className="text-sm font-medium text-text-primary">Submission Protocol</p>
                </div>
                <button
                  onClick={() => updateSession({ isSubmissionOpen: !session.isSubmissionOpen })}
                  className={`w-full p-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-3 ${
                    session.isSubmissionOpen 
                      ? 'bg-brand text-white border-brand shadow-sm' 
                      : 'bg-white border-line text-text-secondary hover:border-gray-300'
                  }`}
                >
                  {session.isSubmissionOpen ? <Unlock size={18} /> : <Lock size={18} />}
                  {session.isSubmissionOpen ? 'Submissions Open' : 'Submissions Locked'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-brand" />
                  <p className="text-sm font-medium text-text-primary">Team Override</p>
                </div>
                <button
                  onClick={() => updateSession({ isTeamLockOpen: !session.isTeamLockOpen })}
                  className={`w-full p-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-3 ${
                    session.isTeamLockOpen 
                      ? 'bg-text-primary text-white border-text-primary shadow-sm' 
                      : 'bg-white border-line text-text-secondary hover:border-gray-300'
                  }`}
                >
                  {session.isTeamLockOpen ? <Unlock size={18} /> : <Lock size={18} />}
                  {session.isTeamLockOpen ? 'Team Locks Open' : 'Team Locks Engaged'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          {/* Team Monitor */}
          <div className="apple-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-brand" />
                <h2 className="text-lg font-semibold text-text-primary">Team Monitor</h2>
              </div>
              <span className="text-sm text-text-secondary">{teams.length} Active</span>
            </div>

            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.id} className="p-3 bg-gray-50 rounded-xl border border-line flex justify-between items-center group hover:border-brand/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm font-semibold text-text-primary">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Score</span>
                    <span className="text-sm font-bold text-brand">{team.totalScore}</span>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-4">Waiting for teams to join...</p>
              )}
            </div>
          </div>

          {/* Session Stats */}
          <div className="apple-card p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-line pb-4">
              <Trophy size={18} className="text-brand" />
              <h2 className="text-lg font-semibold text-text-primary">Analytics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-line">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Submissions</p>
                <p className="text-2xl font-bold text-text-primary mt-1">0</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-line">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Avg Accuracy</p>
                <p className="text-2xl font-bold text-text-primary mt-1">0%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
