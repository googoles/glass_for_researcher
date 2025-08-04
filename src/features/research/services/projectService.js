const researchRepository = require('../repositories');
const { v4: uuidv4 } = require('uuid');

/**
 * ProjectService manages research projects with CRUD operations
 * and integrates with Zotero for academic paper management
 */
class ProjectService {
  constructor() {
    this.projects = new Map(); // In-memory cache for active projects
  }

  async initialize() {
    console.log('[Project Service] Initialized');
    
    // Load active projects into cache
    try {
      const activeProjects = await this.getProjects({ status: 'active', limit: 50 });
      for (const project of activeProjects) {
        this.projects.set(project.id, project);
      }
      console.log(`[Project Service] Loaded ${activeProjects.length} active projects`);
    } catch (error) {
      console.warn('[Project Service] Failed to load active projects:', error);
    }
  }

  /**
   * Create a new research project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project
   */
  async createProject(projectData) {
    try {
      const project = {
        id: uuidv4(),
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'active',
        tags: projectData.tags || [],
        zotero_key: projectData.zotero_key || null,
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          session_count: 0,
          total_duration_ms: 0,
          ...projectData.metadata
        },
        goals: projectData.goals || [],
        deadline: projectData.deadline || null,
        priority: projectData.priority || 'medium'
      };

      // Store in repository
      const savedProject = await researchRepository.createProject(project);
      
      // Cache the project
      this.projects.set(savedProject.id, savedProject);
      
      console.log(`[Project Service] Created project: ${savedProject.name} (${savedProject.id})`);
      return savedProject;
    } catch (error) {
      console.error('[Project Service] Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Update an existing project
   * @param {string} projectId - Project ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated project
   */
  async updateProject(projectId, updates) {
    try {
      const existingProject = await this.getProjectById(projectId);
      if (!existingProject) {
        throw new Error('Project not found');
      }

      const updatedProject = {
        ...existingProject,
        ...updates,
        metadata: {
          ...existingProject.metadata,
          ...updates.metadata,
          updated_at: new Date().toISOString()
        }
      };

      // Store in repository
      await researchRepository.updateProject(projectId, updatedProject);
      
      // Update cache
      this.projects.set(projectId, updatedProject);
      
      console.log(`[Project Service] Updated project: ${updatedProject.name} (${projectId})`);
      return updatedProject;
    } catch (error) {
      console.error('[Project Service] Failed to update project:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProject(projectId) {
    try {
      // Check if project exists
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Soft delete - mark as deleted instead of removing
      await this.updateProject(projectId, {
        status: 'deleted',
        metadata: {
          ...project.metadata,
          deleted_at: new Date().toISOString()
        }
      });

      // Remove from cache
      this.projects.delete(projectId);
      
      console.log(`[Project Service] Deleted project: ${project.name} (${projectId})`);
      return true;
    } catch (error) {
      console.error('[Project Service] Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object|null>} Project or null
   */
  async getProjectById(projectId) {
    try {
      // Check cache first
      if (this.projects.has(projectId)) {
        return this.projects.get(projectId);
      }

      // Fetch from repository
      const project = await researchRepository.getProjectById(projectId);
      
      if (project && project.status !== 'deleted') {
        // Cache the project
        this.projects.set(projectId, project);
        return project;
      }
      
      return null;
    } catch (error) {
      console.error('[Project Service] Failed to get project:', error);
      return null;
    }
  }

  /**
   * Get projects with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of projects
   */
  async getProjects(filters = {}) {
    try {
      const projects = await researchRepository.getProjects({
        status: filters.status || 'active',
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        tags: filters.tags,
        sortBy: filters.sortBy || 'updated_at',
        sortOrder: filters.sortOrder || 'desc'
      });

      // Filter out deleted projects
      return projects.filter(project => project.status !== 'deleted');
    } catch (error) {
      console.error('[Project Service] Failed to get projects:', error);
      return [];
    }
  }

  /**
   * Search projects by name or description
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching projects
   */
  async searchProjects(query, options = {}) {
    try {
      const projects = await this.getProjects({
        limit: options.limit || 20,
        status: options.status || 'active'
      });

      const queryLower = query.toLowerCase();
      
      return projects.filter(project => 
        project.name.toLowerCase().includes(queryLower) ||
        project.description.toLowerCase().includes(queryLower) ||
        (project.tags && project.tags.some(tag => 
          tag.toLowerCase().includes(queryLower)
        ))
      );
    } catch (error) {
      console.error('[Project Service] Failed to search projects:', error);
      return [];
    }
  }

  /**
   * Find project by Zotero key
   * @param {string} zoteroKey - Zotero item key
   * @returns {Promise<Object|null>} Project or null
   */
  async findProjectByZoteroKey(zoteroKey) {
    try {
      const projects = await this.getProjects({ limit: 100 });
      return projects.find(project => project.zotero_key === zoteroKey) || null;
    } catch (error) {
      console.error('[Project Service] Failed to find project by Zotero key:', error);
      return null;
    }
  }

  /**
   * Get project statistics
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project statistics
   */
  async getProjectStats(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get sessions for this project
      const sessions = await researchRepository.getSessionsByProject(projectId);
      const completedSessions = sessions.filter(s => s.end_time);
      
      // Calculate statistics
      const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_ms || 0), 0);
      const avgSessionLength = completedSessions.length > 0 
        ? totalDuration / completedSessions.length 
        : 0;

      // Get recent analysis data
      const recentAnalysis = await researchRepository.getProjectAnalysis(projectId, 7); // Last 7 days
      const avgProductivity = recentAnalysis.length > 0
        ? recentAnalysis.reduce((sum, a) => sum + (a.productivity_score || 0), 0) / recentAnalysis.length
        : 0;

      const stats = {
        session_count: sessions.length,
        completed_sessions: completedSessions.length,
        total_duration_ms: totalDuration,
        avg_session_length_ms: avgSessionLength,
        avg_productivity_score: avgProductivity,
        last_activity: sessions.length > 0 
          ? Math.max(...sessions.map(s => new Date(s.start_time).getTime()))
          : null,
        created_days_ago: Math.floor((Date.now() - new Date(project.metadata.created_at).getTime()) / (24 * 60 * 60 * 1000))
      };

      // Update project metadata with fresh stats
      await this.updateProject(projectId, {
        metadata: {
          ...project.metadata,
          stats,
          stats_updated_at: new Date().toISOString()
        }
      });

      return stats;
    } catch (error) {
      console.error('[Project Service] Failed to get project stats:', error);
      return null;
    }
  }

  /**
   * Add goal to project
   * @param {string} projectId - Project ID
   * @param {Object} goal - Goal object
   * @returns {Promise<Object>} Updated project
   */
  async addProjectGoal(projectId, goal) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const newGoal = {
        id: uuidv4(),
        title: goal.title,
        description: goal.description || '',
        target_value: goal.target_value,
        current_value: goal.current_value || 0,
        unit: goal.unit || 'sessions',
        status: goal.status || 'active',
        created_at: new Date().toISOString()
      };

      const updatedGoals = [...(project.goals || []), newGoal];
      
      return await this.updateProject(projectId, { goals: updatedGoals });
    } catch (error) {
      console.error('[Project Service] Failed to add project goal:', error);
      throw error;
    }
  }

  /**
   * Update project goal
   * @param {string} projectId - Project ID
   * @param {string} goalId - Goal ID
   * @param {Object} updates - Goal updates
   * @returns {Promise<Object>} Updated project
   */
  async updateProjectGoal(projectId, goalId, updates) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const updatedGoals = (project.goals || []).map(goal => 
        goal.id === goalId 
          ? { ...goal, ...updates, updated_at: new Date().toISOString() }
          : goal
      );

      return await this.updateProject(projectId, { goals: updatedGoals });
    } catch (error) {
      console.error('[Project Service] Failed to update project goal:', error);
      throw error;
    }
  }

  /**
   * Get project progress summary
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Progress summary
   */
  async getProjectProgress(projectId) {
    try {
      const [project, stats] = await Promise.all([
        this.getProjectById(projectId),
        this.getProjectStats(projectId)
      ]);

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate goal progress
      const goalProgress = (project.goals || []).map(goal => {
        const progress = goal.target_value > 0 
          ? Math.min(100, (goal.current_value / goal.target_value) * 100)
          : 0;
        
        return {
          ...goal,
          progress_percentage: progress,
          is_completed: progress >= 100
        };
      });

      // Overall project health score
      const healthFactors = {
        recent_activity: stats.last_activity && (Date.now() - stats.last_activity) < (7 * 24 * 60 * 60 * 1000) ? 25 : 0,
        productivity: Math.min(25, (stats.avg_productivity_score || 0) * 25 / 100),
        goal_completion: goalProgress.length > 0 
          ? (goalProgress.filter(g => g.is_completed).length / goalProgress.length) * 25
          : 0,
        consistency: stats.session_count > 5 ? 25 : (stats.session_count * 5)
      };

      const healthScore = Math.round(
        healthFactors.recent_activity + 
        healthFactors.productivity + 
        healthFactors.goal_completion + 
        healthFactors.consistency
      );

      return {
        project_id: projectId,
        stats,
        goals: goalProgress,
        health_score: healthScore,
        health_factors: healthFactors,
        recommendations: this.generateRecommendations(project, stats, goalProgress, healthScore)
      };
    } catch (error) {
      console.error('[Project Service] Failed to get project progress:', error);
      return null;
    }
  }

  /**
   * Generate recommendations for project improvement
   * @private
   */
  generateRecommendations(project, stats, goals, healthScore) {
    const recommendations = [];

    if (healthScore < 50) {
      recommendations.push({
        type: 'warning',
        title: 'Low Project Health',
        message: 'This project needs attention to improve overall health score.'
      });
    }

    if (stats.last_activity && (Date.now() - stats.last_activity) > (7 * 24 * 60 * 60 * 1000)) {
      recommendations.push({
        type: 'action',
        title: 'Resume Activity',
        message: 'No recent activity detected. Consider scheduling time to work on this project.'
      });
    }

    if (stats.avg_productivity_score < 50) {
      recommendations.push({
        type: 'improvement',
        title: 'Improve Focus',
        message: 'Productivity scores are below average. Try eliminating distractions during work sessions.'
      });
    }

    const incompleteGoals = goals.filter(g => !g.is_completed);
    if (incompleteGoals.length > 0) {
      recommendations.push({
        type: 'goal',
        title: 'Work on Goals',
        message: `${incompleteGoals.length} goals are still pending completion.`
      });
    }

    if (stats.session_count < 5) {
      recommendations.push({
        type: 'consistency',
        title: 'Build Consistency',
        message: 'Establish a regular work pattern to build momentum on this project.'
      });
    }

    return recommendations;
  }

  /**
   * Archive completed project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Archived project
   */
  async archiveProject(projectId) {
    try {
      const project = await this.updateProject(projectId, {
        status: 'archived',
        metadata: {
          archived_at: new Date().toISOString()
        }
      });

      // Remove from active cache
      this.projects.delete(projectId);
      
      return project;
    } catch (error) {
      console.error('[Project Service] Failed to archive project:', error);
      throw error;
    }
  }

  /**
   * Restore archived project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Restored project
   */
  async restoreProject(projectId) {
    try {
      const project = await this.updateProject(projectId, {
        status: 'active',
        metadata: {
          restored_at: new Date().toISOString()
        }
      });

      // Add back to active cache
      this.projects.set(projectId, project);
      
      return project;
    } catch (error) {
      console.error('[Project Service] Failed to restore project:', error);
      throw error;
    }
  }
}

module.exports = ProjectService;