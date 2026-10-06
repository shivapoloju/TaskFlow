import React, { useState } from 'react';
import { BookOpen, Copy, Check, ExternalLink, Shield, Code, Server, Key } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const ApiDocsPage: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/register',
      desc: 'Register a new user account with role selection (Admin, Manager, Member)',
      authRequired: false,
      role: 'Public',
      sampleCurl: `curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Dev Lead", "email": "lead@taskflow.dev", "password": "password123", "role": "Manager"}'`
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      desc: 'Authenticate user with credentials & issue JWT Access Token + Refresh Token',
      authRequired: false,
      role: 'Public',
      sampleCurl: `curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@taskflow.dev", "password": "password123"}'`
    },
    {
      method: 'POST',
      path: '/api/auth/refresh',
      desc: 'Rotate JWT access token using single-use refresh token',
      authRequired: false,
      role: 'Public',
      sampleCurl: `curl -X POST http://localhost:5000/api/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken": "<REFRESH_TOKEN>"}'`
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      desc: 'Get current authenticated user profile and role details',
      authRequired: true,
      role: 'All Authenticated Users',
      sampleCurl: `curl -X GET http://localhost:5000/api/auth/me \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`
    },
    {
      method: 'GET',
      path: '/api/tasks',
      desc: 'Get paginated task list with server-side filters & JOIN query benchmarks (executionTimeMs)',
      authRequired: true,
      role: 'All Authenticated Users',
      sampleCurl: `curl -X GET "http://localhost:5000/api/tasks?page=1&limit=10&status=In%20Progress&priority=High" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`
    },
    {
      method: 'POST',
      path: '/api/tasks',
      desc: 'Create a new project task item with due date and estimated hours',
      authRequired: true,
      role: 'Admin / Manager',
      sampleCurl: `curl -X POST http://localhost:5000/api/tasks \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Implement PostgreSQL Indexes", "status": "In Progress", "priority": "High", "projectId": 1}'`
    },
    {
      method: 'PATCH',
      path: '/api/tasks/:id',
      desc: 'Update task status, priority, or assignee',
      authRequired: true,
      role: 'Admin / Manager / Assigned Member',
      sampleCurl: `curl -X PATCH http://localhost:5000/api/tasks/1 \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "Completed"}'`
    },
    {
      method: 'DELETE',
      path: '/api/tasks/:id',
      desc: 'Delete task item',
      authRequired: true,
      role: 'Admin / Manager',
      sampleCurl: `curl -X DELETE http://localhost:5000/api/tasks/1 \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`
    },
    {
      method: 'GET',
      path: '/api/projects',
      desc: 'Get list of active projects with team relations and task progress metrics',
      authRequired: true,
      role: 'All Authenticated Users',
      sampleCurl: `curl -X GET http://localhost:5000/api/projects \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`
    },
    {
      method: 'POST',
      path: '/api/projects',
      desc: 'Create new project workspace',
      authRequired: true,
      role: 'Admin / Manager',
      sampleCurl: `curl -X POST http://localhost:5000/api/projects \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "TaskFlow 2.0 Web Platform", "teamId": 1, "status": "In Progress"}'`
    },
    {
      method: 'GET',
      path: '/api/teams',
      desc: 'List teams and member allocation metrics',
      authRequired: true,
      role: 'All Authenticated Users',
      sampleCurl: `curl -X GET http://localhost:5000/api/teams \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`
    },
    {
      method: 'POST',
      path: '/api/teams/:id/members',
      desc: 'Assign member to team with role governance',
      authRequired: true,
      role: 'Admin / Manager',
      sampleCurl: `curl -X POST http://localhost:5000/api/teams/1/members \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"userId": 3, "role": "Member"}'`
    }
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <div className="page-content">
            <div className="page-header">
              <div>
                <h1 className="page-title">REST API Specifications & Swagger Documentation</h1>
                <p className="page-subtitle">Interactive OpenAPI 3.0 documented endpoints featuring JWT auth, Joi request validation, and RBAC.</p>
              </div>
              <a
                href="http://localhost:5000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <ExternalLink size={16} />
                <span>Open Interactive Swagger UI</span>
              </a>
            </div>

            {/* Overview Banner */}
            <div className="api-overview-banner glass-card">
              <div className="banner-item">
                <Code size={18} className="text-indigo-400" />
                <span><strong>Contract Specs:</strong> 25+ Endpoint Routes</span>
              </div>
              <div className="banner-item">
                <Key size={18} className="text-amber-400" />
                <span><strong>Security:</strong> Bearer JWT + Refresh Tokens</span>
              </div>
              <div className="banner-item">
                <Server size={18} className="text-emerald-400" />
                <span><strong>Response Format:</strong> Centralized JSON Handlers</span>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="endpoints-list">
              {endpoints.map((ep, idx) => (
                <div key={idx} className="endpoint-card glass-card hover-lift">
                  <div className="endpoint-header">
                    <div className="method-path-group">
                      <span className={`method-badge method-${ep.method.toLowerCase()}`}>
                        {ep.method}
                      </span>
                      <code className="path-code">{ep.path}</code>
                    </div>
                    <div className="role-requirement-badge">
                      <Shield size={12} />
                      <span>{ep.role}</span>
                    </div>
                  </div>

                  <p className="endpoint-desc">{ep.desc}</p>

                  <div className="curl-box">
                    <div className="curl-header">
                      <span>cURL Command Sample</span>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy(ep.sampleCurl, idx)}
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy cURL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="curl-code"><code>{ep.sampleCurl}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApiDocsPage;
