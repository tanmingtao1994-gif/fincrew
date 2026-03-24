import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { DetailViewPage } from './pages/DetailViewPage';

function App() {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  return (
    <div className="h-screen w-full bg-white font-sans text-gray-900 flex flex-col overflow-hidden relative">
      {/* Main Home Page */}
      <HomePage onSelectTest={setSelectedTestId} />

      {/* Drawer Overlay for Detail View */}
      {selectedTestId && (
        <div className="absolute inset-0 z-50 flex justify-end bg-black bg-opacity-30 transition-opacity">
          <div className="w-full md:w-3/4 lg:w-2/3 xl:w-1/2 h-full bg-white shadow-2xl flex flex-col transform transition-transform translate-x-0">
            <DetailViewPage testId={selectedTestId} onBack={() => setSelectedTestId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;