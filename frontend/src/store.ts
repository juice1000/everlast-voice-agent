import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

interface InterviewState {
  transcript: string;
  role: string;
  candidateName: string;
  candidateEmail: string;
  setTranscript: (t: string) => void;
  setRole: (r: string) => void;
  setCandidateName: (n: string) => void;
  setCandidateEmail: (e: string) => void;
  reset: () => void;
}

const creator: StateCreator<InterviewState> = (set) => ({
  transcript: '',
  role: 'Software Engineer',
  candidateName: '',
  candidateEmail: '',
  setTranscript: (t: string) => set({ transcript: t }),
  setRole: (r: string) => set({ role: r }),
  setCandidateName: (n: string) => set({ candidateName: n }),
  setCandidateEmail: (e: string) => set({ candidateEmail: e }),
  reset: () => set({ transcript: '', role: 'Software Engineer', candidateName: '', candidateEmail: '' }),
});

export const useInterviewStore = create<InterviewState>()(persist(creator, { name: 'interview-form' }));
