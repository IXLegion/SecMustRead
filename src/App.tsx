import React, { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, Download, PieChart, AlertTriangle, Clock, CheckCircle, Upload } from 'lucide-react';

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  completed: boolean;
  notes: string;
};

type Report = {
  id: string;
  type: 'defectdojo' | 'sonarqube';
  name: string;
  uploadDate: Date;
  findings: Finding[];
};

type Finding = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'open' | 'closed';
};

const initialChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Authentication Implementation Review',
    description: 'Verify secure password hashing, MFA implementation, and session management.',
    category: 'critical',
    completed: false,
    notes: ''
  },
  {
    id: '2',
    title: 'Data Encryption Standards',
    description: 'Ensure all sensitive data is encrypted at rest and in transit using industry standards.',
    category: 'critical',
    completed: false,
    notes: ''
  },
  {
    id: '3',
    title: 'Access Control Audit',
    description: 'Review role-based access control (RBAC) implementation and permissions.',
    category: 'high',
    completed: false,
    notes: ''
  },
  {
    id: '4',
    title: 'Security Headers Configuration',
    description: 'Verify implementation of security headers including CSP, HSTS, etc.',
    category: 'medium',
    completed: false,
    notes: ''
  },
  {
    id: '5',
    title: 'Dependency Vulnerability Scan',
    description: 'Check for known vulnerabilities in project dependencies.',
    category: 'high',
    completed: false,
    notes: ''
  }
];

function App() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [view, setView] = useState<'dashboard' | 'checklist' | 'reports'>('dashboard');
  
  const [reports, setReports] = useState<Report[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleComplete = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const updateNotes = (id: string, notes: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, notes } : item
    ));
  };

  const generateReport = () => {
    const report = checklist.map(item => `
${item.title}
Status: ${item.completed ? 'Completed' : 'Pending'}
Category: ${item.category}
Notes: ${item.notes || 'No notes'}
-------------------
`).join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'security-checklist-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredChecklist = checklist.filter(item => {
    if (filter === 'completed') return item.completed;
    if (filter === 'pending') return !item.completed;
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getMetrics = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    const critical = checklist.filter(item => item.category === 'critical').length;
    const criticalCompleted = checklist.filter(item => item.category === 'critical' && item.completed).length;
    
    return {
      total,
      completed,
      pending: total - completed,
      completionRate: Math.round((completed / total) * 100),
      critical,
      criticalCompleted,
      criticalPending: critical - criticalCompleted
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'defectdojo' | 'sonarqube') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const newReport: Report = {
        id: crypto.randomUUID(),
        type,
        name: file.name,
        uploadDate: new Date(),
        findings: processReportFindings(data, type)
      };

      setReports(prev => [...prev, newReport]);
      setUploadModalOpen(false);
    } catch (error) {
      console.error('Error processing report:', error);
      alert('Error processing report. Please ensure it\'s a valid JSON file.');
    }
  };

  const processReportFindings = (data: any, type: 'defectdojo' | 'sonarqube'): Finding[] => {
    if (type === 'defectdojo') {
      return data.findings?.map((finding: any) => ({
        id: crypto.randomUUID(),
        title: finding.title,
        severity: finding.severity.toLowerCase(),
        description: finding.description,
        status: finding.active ? 'open' : 'closed'
      })) || [];
    } else {
      return data.issues?.map((issue: any) => ({
        id: crypto.randomUUID(),
        title: issue.message,
        severity: mapSonarQubeSeverity(issue.severity),
        description: issue.description || issue.message,
        status: issue.status.toLowerCase()
      })) || [];
    }
  };

  const mapSonarQubeSeverity = (severity: string): 'critical' | 'high' | 'medium' | 'low' => {
    switch (severity.toLowerCase()) {
      case 'blocker': return 'critical';
      case 'critical': return 'critical';
      case 'major': return 'high';
      case 'minor': return 'medium';
      default: return 'low';
    }
  };

  const metrics = getMetrics();

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PieChart className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overall Progress</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{metrics.completionRate}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">{metrics.completed} of {metrics.total} tasks completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical Issues</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{metrics.criticalPending}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">{metrics.criticalCompleted} of {metrics.critical} critical tasks completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{metrics.pending}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">{metrics.completed} tasks completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{metrics.completed}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">{metrics.pending} tasks remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          <div className="mt-5">
            <div className="flow-root">
              <ul className="-mb-8">
                {checklist.slice(0, 3).map((item, itemIdx) => (
                  <li key={item.id}>
                    <div className="relative pb-8">
                      {itemIdx !== 2 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            item.completed ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <Clock className="h-5 w-5 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {item.title}
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(item.category)}`}>
                                {item.category}
                              </span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <span>{item.completed ? 'Completed' : 'Pending'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Upload Report</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">DefectDojo Report</h3>
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'defectdojo')}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
          </div>
          <div>
            <h3 className="font-medium mb-2">SonarQube Report</h3>
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'sonarqube')}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
          </div>
          <button
            onClick={() => setUploadModalOpen(false)}
            className="mt-4 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Security Reports</h2>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a report.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map(report => (
            <div key={report.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {report.name}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-100 text-indigo-800">
                        {report.type}
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Uploaded on {report.uploadDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Findings</h4>
                  <div className="mt-2 divide-y divide-gray-200">
                    {report.findings.map(finding => (
                      <div key={finding.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              finding.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {finding.severity}
                            </span>
                            <span className="ml-2 text-sm font-medium text-gray-900">{finding.title}</span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            finding.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {finding.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Security Checklist System</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-md ${
                  view === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('checklist')}
                className={`px-4 py-2 rounded-md ${
                  view === 'checklist' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Checklist
              </button>
              <button
                onClick={() => setView('reports')}
                className={`px-4 py-2 rounded-md ${
                  view === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Reports
              </button>
              <button
                onClick={generateReport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' ? (
          renderDashboard()
        ) : view === 'reports' ? (
          renderReports()
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredChecklist.map(item => (
                <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div 
                    className="px-4 py-5 sm:p-6 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(item.id);
                          }}
                          className={`p-1 rounded-full ${
                            item.completed 
                              ? 'text-green-600 hover:text-green-700' 
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          <CheckCircle2 className={`h-6 w-6 ${item.completed ? 'fill-green-100' : ''}`} />
                        </button>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedItems.has(item.id) && (
                    <div className="px-4 py-5 sm:p-6 border-t border-gray-200 bg-gray-50">
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      <div className="mt-4">
                        <label htmlFor={`notes-${item.id}`} className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          id={`notes-${item.id}`}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Add your notes here..."
                          value={item.notes}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {uploadModalOpen && renderUploadModal()}
    </div>
  );
}

export default App;