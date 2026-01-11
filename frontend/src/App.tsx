import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestExecution from './pages/TestExecution';
import TestFailure from './pages/TestFailure';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test-execution" element={<TestExecution />} />
          <Route path="/test-execution/:executionId" element={<TestExecution />} />
          <Route path="/test-failures/:testId" element={<TestFailure />} />
          <Route path="/reports/:executionId" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
