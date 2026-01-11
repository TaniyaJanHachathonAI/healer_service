import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const quickActions = [
    {
      icon: '🎭',
      title: 'Test Execution',
      description: 'Execute Playwright tests and view results with self-healing capabilities',
      path: '/test-execution',
    },
  ];

  const features = [
    {
      title: 'Test Execution',
      description: 'Execute Playwright tests from the dashboard with real-time status tracking and comprehensive results.',
    },
    {
      title: 'Self-Healing Automation',
      description: 'Automatic selector healing with AI-powered suggestions when tests fail due to broken locators.',
    },
    {
      title: 'Detailed Reports',
      description: 'Comprehensive analysis reports with screenshots, failure details, and full test execution data.',
    },
    {
      title: 'Failure Analysis',
      description: 'In-depth failure analysis with screenshots, HTML snapshots, and semantic DOM data for debugging.',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Test Automation Dashboard</h1>
        <p>Self-healing test automation with AI-powered selector healing</p>
      </div>

      <div className="quick-actions">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path} className="action-card">
            <div className="action-card-header">
              <span className="action-icon">{action.icon}</span>
              <h3 className="action-title">{action.title}</h3>
            </div>
            <p className="action-description">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
