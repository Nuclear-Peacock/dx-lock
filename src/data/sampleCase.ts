import { Case } from '../types';

export const CARDIAC_AMYLOID_CASE: Case = {
  id: 'cardiac-amyloid-001',
  title: 'Cardiac Amyloidosis',
  authorId: 'system',
  reveals: [
    {
      type: 'image',
      url: 'https://picsum.photos/seed/cardiac1/1200/800',
      attribution: 'Radiopaedia.org',
      label: 'Chest X-Ray'
    },
    {
      type: 'image',
      url: 'https://picsum.photos/seed/cardiac2/1200/800',
      attribution: 'Radiopaedia.org',
      label: 'Cardiac MRI - LGE'
    },
    {
      type: 'image',
      url: 'https://picsum.photos/seed/cardiac3/1200/800',
      attribution: 'Radiopaedia.org',
      label: 'Technetium Pyrophosphate (PYP) Scan'
    }
  ],
  correctDiagnosis: 'Cardiac Amyloidosis (ATTR type)',
  management: 'Refer to Cardiology, evaluate for systemic involvement, consider tafamidis.'
};
