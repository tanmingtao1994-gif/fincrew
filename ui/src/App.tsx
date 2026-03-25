import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { DetailViewPage } from './pages/DetailViewPage';
import { ConfigProvider } from 'antd';

import './App.css'

function App() {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#1677ff' },
      components: {
        Layout: { headerBg: '#ffffff', bodyBg: '#ffffff' }
      }
    }}>
      <div className="h-screen w-full bg-white font-sans text-gray-900 flex flex-col overflow-hidden relative">
        {/* Main Home Page */}
        <HomePage onSelectTest={setSelectedTestId} />

        {/* Drawer Component for Detail View */}
        <DetailViewPage 
          testId={selectedTestId} 
          onClose={() => setSelectedTestId(null)} 
        />
      </div>
    </ConfigProvider>
  );
}

export default App;