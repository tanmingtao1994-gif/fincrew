import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { DetailViewPage } from './pages/DetailViewPage';

function App() {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  return (
    <div className="h-screen w-full bg-gray-100 font-sans text-gray-900 flex flex-col overflow-hidden">
      {!selectedTestId ? (
        <HomePage onSelectTest={setSelectedTestId} />
      ) : (
        <DetailViewPage testId={selectedTestId} onBack={() => setSelectedTestId(null)} />
      )}
    </div>
  );
}

export default App;