#!/usr/bin/env node
/**
 * Test script to verify Glass Activity API components work correctly
 * This bypasses the complex Electron startup and tests the core functionality
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { EventEmitter } = require('events');

// Mock event bridge for testing
const mockEventBridge = new EventEmitter();

// Add invoke method to mock bridge
mockEventBridge.invoke = async (channel, data) => {
  console.log(`[Mock Bridge] Invoking ${channel} with data:`, data);
  
  // Mock responses for activity service methods
  switch (channel) {
    case 'activity:get-tracking-status':
      return {
        isTracking: false,
        currentActivity: null,
        lastAnalysis: null,
        captureInterval: 15 * 60 * 1000,
        nextCaptureIn: null,
        settings: {
          enableAIAnalysis: true,
          captureInterval: 15 * 60 * 1000
        }
      };
      
    case 'activity:start-tracking':
      console.log('[Mock] Starting activity tracking...');
      return { success: true, message: 'Activity tracking started' };
      
    case 'activity:stop-tracking':
      console.log('[Mock] Stopping activity tracking...');
      return { success: true, message: 'Activity tracking stopped' };
      
    case 'activity:capture-screenshot':
      console.log('[Mock] Capturing screenshot...');
      return {
        success: true,
        analysis: {
          category: 'focus',
          confidence: 0.85,
          timestamp: Date.now(),
          productivity: 7.5
        }
      };
      
    case 'activity:generate-insights':
      console.log('[Mock] Generating insights...');
      return {
        insights: [
          {
            type: 'productivity',
            title: 'Good Focus Session',
            description: 'You maintained good focus for the past hour',
            importance: 'medium'
          },
          {
            type: 'break',
            title: 'Take a Break',
            description: 'Consider taking a short break to maintain productivity',
            importance: 'low'
          }
        ],
        recommendations: [
          {
            title: 'Optimize Break Times',
            description: 'Take breaks every 45-60 minutes for optimal productivity',
            category: 'productivity'
          }
        ],
        trends: {
          productivity: 'improving',
          focus: 'stable'
        }
      };
      
    case 'activity:get-activities':
      console.log('[Mock] Getting activities...');
      return [
        {
          id: 'test-session-1',
          title: 'Development Work',
          session_type: 'activity',
          started_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          ended_at: Math.floor(Date.now() / 1000) - 1800,   // 30 min ago
          category: 'focus',
          productivity_score: 8
        },
        {
          id: 'test-session-2', 
          title: 'Email and Communication',
          session_type: 'activity',
          started_at: Math.floor(Date.now() / 1000) - 1800, // 30 min ago
          ended_at: Math.floor(Date.now() / 1000) - 900,    // 15 min ago
          category: 'communication',
          productivity_score: 6
        }
      ];
      
    case 'activity:get-activity-details':
      console.log('[Mock] Getting activity details for:', data.activityId);
      return {
        id: data.activityId,
        title: 'Test Activity',
        session_type: 'activity',
        started_at: Math.floor(Date.now() / 1000) - 3600,
        ended_at: Math.floor(Date.now() / 1000) - 1800,
        category: 'focus',
        productivity_score: 8,
        screenshots: [],
        analysis: 'Mock analysis data'
      };
      
    case 'research:get-current-productivity-score':
      console.log('[Mock] Getting current productivity score...');
      return {
        score: 7.5,
        timestamp: Date.now(),
        confidence: 0.85,
        analysis: 'Good focus with minimal distractions'
      };
      
    default:
      console.log(`[Mock Bridge] Unknown channel: ${channel}`);
      return { error: 'Unknown channel', channel };
  }
};

async function startTestServer() {
  console.log('🧪 Starting Glass Activity API Test Server...');
  
  // Create backend app
  const createBackendApp = require('./pickleglass_web/backend_node');
  const app = createBackendApp(mockEventBridge);
  
  // Set up CORS for testing
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  
  const API_PORT = 9001;
  
  // Start API server
  const server = app.listen(API_PORT, () => {
    console.log(`🚀 Test API Server running on http://localhost:${API_PORT}`);
    console.log('');
    console.log('📋 Available endpoints to test:');
    console.log(`   GET  http://localhost:${API_PORT}/api/activity/current`);
    console.log(`   POST http://localhost:${API_PORT}/api/activity/tracking/start`);  
    console.log(`   POST http://localhost:${API_PORT}/api/activity/tracking/stop`);
    console.log(`   POST http://localhost:${API_PORT}/api/activity/capture`);
    console.log(`   GET  http://localhost:${API_PORT}/api/activity/insights`);
    console.log(`   GET  http://localhost:${API_PORT}/api/activity/sessions`);
    console.log(`   GET  http://localhost:${API_PORT}/api/research/analysis/current-score`);
    console.log('');
    console.log('🌐 Test the activity page at: http://localhost:3001/activity');
    console.log('   (Make sure Next.js dev server is running on port 3001)');
    console.log('');
    console.log('✅ Press Ctrl+C to stop the test server');
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    server.close(() => {
      console.log('✅ Test server stopped');
      process.exit(0);
    });
  });
}

// Start the test server
startTestServer().catch(error => {
  console.error('❌ Failed to start test server:', error);
  process.exit(1);
});