export interface DemoPrediction {
  id: string;
  label: string;
  hi: string;
  confidence: number;
}

/**
 * Sample prediction sets used ONLY in Child Mode demo state. These are not
 * produced by a trained model, Milestone 1 has no model. Always rendered
 * behind a clearly labeled "Demo mode" banner.
 */
export const DEMO_PREDICTION_SETS: DemoPrediction[][] = [
  [
    { id: 'p1', label: 'I need help', hi: 'मुझे मदद चाहिए', confidence: 0.82 },
    { id: 'p2', label: 'I need water', hi: 'मुझे पानी चाहिए', confidence: 0.54 },
    { id: 'p3', label: 'I am tired', hi: 'मैं थका हुआ हूँ', confidence: 0.31 },
  ],
  [
    { id: 'p4', label: 'Thank you', hi: 'धन्यवाद', confidence: 0.76 },
    { id: 'p5', label: 'Yes', hi: 'हाँ', confidence: 0.49 },
    { id: 'p6', label: 'Hello!', hi: 'नमस्ते!', confidence: 0.28 },
  ],
  [
    { id: 'p7', label: 'I am hungry', hi: 'मुझे भूख लगी है', confidence: 0.41 },
    { id: 'p8', label: 'I am thirsty', hi: 'मुझे प्यास लगी है', confidence: 0.38 },
    { id: 'p9', label: 'I need a break', hi: 'मुझे थोड़ा आराम चाहिए', confidence: 0.22 },
  ],
];

export const LOW_CONFIDENCE_THRESHOLD = 0.5;
