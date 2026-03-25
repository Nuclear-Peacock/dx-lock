import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Case, Reveal, UserProfile } from '../types';
import { 
  Save, 
  Plus, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ChevronLeft,
  Activity,
  Shield,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';

interface CaseEditorProps {
  profile: UserProfile;
}

export default function CaseEditor({ profile }: CaseEditorProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [management, setManagement] = useState('');
  const [reveals, setReveals] = useState<Reveal[]>([]);

  useEffect(() => {
    if (caseId && caseId !== 'new') {
      const fetchCase = async () => {
        setLoading(true);
        const docRef = doc(db, 'cases', caseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Case;
          setTitle(data.title);
          setDiagnosis(data.correctDiagnosis || '');
          setManagement(data.management || '');
          setReveals(data.reveals || []);
        }
        setLoading(false);
      };
      fetchCase();
    }
  }, [caseId]);

  const addReveal = () => {
    const newReveal: Reveal = {
      type: 'static',
      url: '',
      label: '',
      attribution: ''
    };
    setReveals([...reveals, newReveal]);
  };

  const removeReveal = (index: number) => {
    setReveals(reveals.filter((_, i) => i !== index));
  };

  const updateReveal = (index: number, updates: Partial<Reveal>) => {
    const newReveals = [...reveals];
    newReveals[index] = { ...newReveals[index], ...updates };
    setReveals(newReveals);
  };

  const handleFileUpload = async (index: number, file: File) => {
    try {
      const storageRef = ref(storage, `cases/${profile.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      updateReveal(index, { url, type: 'image' });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image.');
    }
  };

  const saveCase = async () => {
    if (!title) {
      alert('Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      const caseData: Partial<Case> = {
        title,
        correctDiagnosis: diagnosis,
        management,
        reveals,
        authorId: profile.uid,
      };

      if (caseId && caseId !== 'new') {
        await updateDoc(doc(db, 'cases', caseId), caseData);
      } else {
        await addDoc(collection(db, 'cases'), caseData);
      }
      navigate('/educator');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-brand animate-pulse font-medium">Loading Case Data...</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-line pb-8">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/educator')}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-brand transition-colors mb-4"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2 text-brand text-sm font-semibold">
            <Layers size={16} /> Case Editor
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">
            {caseId === 'new' ? 'Create' : 'Edit'} Case
          </h1>
          <p className="text-sm text-text-secondary">Define case content and reveal sequence.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={saveCase}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>{saving ? 'Saving...' : 'Save Case'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Basic Info */}
        <div className="apple-card p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <Activity size={18} className="text-brand" />
            <h2 className="text-lg font-semibold text-text-primary">Core Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text-primary">Case Title</label>
                <span className="text-xs text-text-secondary">Required</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field text-lg font-semibold"
                placeholder="e.g., Acute Pulmonary Embolism"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Correct Diagnosis</label>
              <div className="relative">
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="input-field pl-10"
                  placeholder="The correct clinical conclusion"
                />
                <CheckCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Management Plan</label>
              <div className="relative">
                <input
                  type="text"
                  value={management}
                  onChange={(e) => setManagement(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Primary treatment pathway"
                />
                <Activity size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Reveals */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-text-primary">Reveal Sequence ({reveals.length})</h2>
            <button
              onClick={addReveal}
              className="btn-secondary text-sm py-2"
            >
              <Plus size={16} /> Add Reveal
            </button>
          </div>

          <div className="space-y-6">
            {reveals.map((reveal, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index} 
                className="apple-card p-6 space-y-6 relative group"
              >
                <button 
                  onClick={() => removeReveal(index)}
                  className="absolute top-6 right-6 p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-center gap-4 border-b border-line pb-6">
                  <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center font-semibold text-brand">
                    {index + 1}
                  </div>
                  <div className="flex-1 max-w-md">
                    <label className="text-xs font-medium text-text-secondary mb-1 block">Reveal Label</label>
                    <input
                      type="text"
                      value={reveal.label}
                      onChange={(e) => updateReveal(index, { label: e.target.value })}
                      className="w-full bg-transparent border-b border-line p-1 text-lg font-semibold focus:border-brand outline-none transition-all text-text-primary placeholder:text-text-secondary/50"
                      placeholder="e.g., Initial Presentation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Asset Mode Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Activity size={16} className="text-brand" /> Asset Type
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'static', label: 'Text Content', icon: FileText, desc: 'Plain text or reference' },
                        { id: 'external', label: 'External Link', icon: ExternalLink, desc: 'Direct secure URL' },
                        { id: 'image', label: 'Image Upload', icon: Upload, desc: 'Local file upload' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => updateReveal(index, { type: mode.id as any })}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                            reveal.type === mode.id 
                              ? 'border-brand bg-brand/5 ring-1 ring-brand/20' 
                              : 'border-line bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${
                            reveal.type === mode.id ? 'bg-brand text-white' : 'bg-white text-text-secondary'
                          }`}>
                            <mode.icon size={16} />
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-semibold ${
                              reveal.type === mode.id ? 'text-brand' : 'text-text-primary'
                            }`}>
                              {mode.label}
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">
                              {mode.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Asset Content */}
                  <div className="lg:col-span-2 space-y-4">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Shield size={16} className="text-brand" /> Content
                    </label>
                    
                    <div className="bg-gray-50 rounded-xl border border-line p-6 space-y-6">
                      {reveal.type === 'static' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-text-secondary">Text Content</label>
                          </div>
                          <textarea
                            value={reveal.url}
                            onChange={(e) => updateReveal(index, { url: e.target.value })}
                            className="input-field min-h-[120px] resize-none"
                            placeholder="Enter case text, clinical findings, or reference..."
                          />
                        </div>
                      )}

                      {reveal.type === 'external' && (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-text-secondary">External URL</label>
                            </div>
                            <div className="relative">
                              <input
                                type="url"
                                value={reveal.url}
                                onChange={(e) => updateReveal(index, { url: e.target.value })}
                                className="input-field pl-10"
                                placeholder="https://example.com/image.jpg"
                              />
                              <ExternalLink size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            </div>
                          </div>
                          
                          <div className="p-4 bg-brand/5 rounded-xl border border-brand/20">
                            <div className="flex items-start gap-3">
                              <input 
                                type="checkbox" 
                                id={`perm-${index}`}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                                required
                              />
                              <label htmlFor={`perm-${index}`} className="text-sm text-text-secondary cursor-pointer">
                                <span className="font-semibold text-text-primary">Educator Confirmation:</span> I verify that I have obtained all necessary permissions to use this resource.
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {reveal.type === 'image' && (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-xs font-medium text-text-secondary">Image Upload</label>
                            <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-line border-dashed cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
                                  <Upload className="w-5 h-5 text-brand" />
                                </div>
                                <p className="mb-1 text-sm text-text-primary font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-text-secondary">PNG, JPG up to 5MB</p>
                              </div>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(index, file);
                                }}
                              />
                            </label>
                          </div>

                          {reveal.url && (
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-text-secondary">Preview</label>
                              <div className="relative aspect-video bg-gray-100 rounded-xl border border-line overflow-hidden">
                                <img src={reveal.url} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                  <CheckCircle size={14} className="text-success" />
                                  <span className="text-xs font-medium text-text-primary">Verified</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 pt-4 border-t border-line">
                        <label className="text-xs font-medium text-text-secondary">Source Attribution (Optional)</label>
                        <input
                          type="text"
                          value={reveal.attribution}
                          onChange={(e) => updateReveal(index, { attribution: e.target.value })}
                          className="input-field"
                          placeholder="e.g., Radiopaedia.org, Case ID: 12345"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {reveals.length === 0 && (
              <div className="apple-card p-16 text-center bg-gray-50 border-dashed">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center mb-4">
                  <AlertCircle size={24} className="text-text-secondary" />
                </div>
                <p className="text-sm text-text-secondary mb-4">No reveals defined for this case.</p>
                <button 
                  onClick={addReveal}
                  className="text-brand text-sm font-medium hover:underline"
                >
                  + Add First Reveal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
