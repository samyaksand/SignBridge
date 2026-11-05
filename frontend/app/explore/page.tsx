import { Suspense } from 'react';
import { ExploreSignsClient } from './ExploreSignsClient';

export const metadata = {
  title: 'Explore Signs, SignBridge',
  description: 'Search and browse SignBridge\'s verified ISL reference video library.',
};

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreSignsClient />
    </Suspense>
  );
}
