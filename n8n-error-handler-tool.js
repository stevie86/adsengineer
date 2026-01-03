#!/usr/bin/env node

/**
 * N8n Error Handler Tool
 * Interfaces with n8n API to manage error workflows and monitoring
 * Modular design for easy extension
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nErrorHandler {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || process.env.N8N_BASE_URL;
        this.apiKey = config.apiKey || process.env.N8N_API_KEY;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-N8N-API-KEY': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    // Core API methods
    async listWorkflows() {
        try {
            const response = await this.client.get('/rest/workflows');
            return response.data.data;
        } catch (error) {
            throw new Error(`Failed to list workflows: ${error.message}`);
        }
    }

    async getWorkflow(workflowId) {
        try {
            const response = await this.client.get(`/rest/workflows/${workflowId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get workflow ${workflowId}: ${error.message}`);
        }
    }

    async getExecutions(workflowId = null, limit = 20) {
        try {
            const params = { limit };
            if (workflowId) params.workflowId = workflowId;

            const response = await this.client.get('/rest/executions', { params });
            return response.data.data;
        } catch (error) {
            throw new Error(`Failed to get executions: ${error.message}`);
        }
    }

    async updateWorkflow(workflowId, workflowData) {
        try {
            const response = await this.client.put(`/rest/workflows/${workflowId}`, workflowData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to update workflow ${workflowId}: ${error.message}`);
        }
    }

    // Error handling methods
    async createErrorWorkflow(name, errorWorkflowData) {
        try {
            const workflow = {
                name,
                nodes: errorWorkflowData.nodes || [],
                connections: errorWorkflowData.connections || {},
                active: false,
                settings: { executionOrder: 'v1' }
            };

            const response = await this.client.post('/rest/workflows', workflow);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create error workflow: ${error.message}`);
        }
    }

    async addErrorHandlerToWorkflow(workflowId, errorWorkflowId) {
        const workflow = await this.getWorkflow(workflowId);

        // Add error trigger node
        const errorTriggerNode = {
            parameters: {
                httpMethod: 'POST',
                path: 'error',
                options: { responseMode: 'responseNode' }
            },
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [100, 100],
            id: `error-handler-${Date.now()}`,
            name: 'Error Handler Webhook'
        };

        // Add HTTP request node to call error workflow
        const httpRequestNode = {
            parameters: {
                method: 'POST',
                url: `${this.baseUrl}/webhook/error-workflow-${errorWorkflowId}`,
                sendBody: true,
                specifyBody: 'json',
                jsonBody: {
                    errorWorkflowId,
                    originalWorkflowId: workflowId,
                    error: '={{ $json.error }}',
                    timestamp: '={{ $now }}'
                }
            },
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4.2,
            position: [300, 100],
            id: `error-caller-${Date.now()}`,
            name: 'Call Error Workflow'
        };

        // Add nodes to workflow
        workflow.nodes.push(errorTriggerNode);
        workflow.nodes.push(httpRequestNode);

        // Add connection
        workflow.connections[errorTriggerNode.name] = {
            main: [[{ node: httpRequestNode.name, type: 'main', index: 0 }]]
        };

        return await this.updateWorkflow(workflowId, workflow);
    }

    async monitorAndHandleErrors(pollInterval = 30000) {
        console.log('🚀 Starting error monitoring...');

        setInterval(async () => {
            try {
                const executions = await this.getExecutions(null, 10);

                for (const execution of executions) {
                    if (execution.status === 'error' && !execution.errorHandled) {
                        await this.handleExecutionError(execution);
                    }
                }
            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        }, pollInterval);
    }

    async handleExecutionError(execution) {
        console.log(`🔥 Handling error in workflow ${execution.workflowId}`);

        // Mark as handled (you might want to store this in a database)
        execution.errorHandled = true;

        // Trigger error workflow (implement based on your setup)
        // This could call a specific error workflow or send notifications

        const errorData = {
            workflowId: execution.workflowId,
            executionId: execution.id,
            error: execution.error,
            timestamp: new Date().toISOString()
        };

        // Example: Send to error workflow webhook
        try {
            await this.client.post('/webhook/error-handler', errorData);
        } catch (webhookError) {
            console.error('❌ Failed to trigger error workflow:', webhookError.message);
        }
    }

    // Utility methods
    async saveWorkflowToFile(workflowId, filename) {
        const workflow = await this.getWorkflow(workflowId);
        await fs.writeFile(filename, JSON.stringify(workflow, null, 2));
        console.log(`💾 Workflow saved to ${filename}`);
    }

    async loadWorkflowFromFile(filename) {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    }

    // Configuration validation
    validateConfig() {
        if (!this.baseUrl) throw new Error('N8N_BASE_URL is required');
        if (!this.apiKey) throw new Error('N8N_API_KEY is required');
        return true;
    }
}

// CLI interface for easy usage
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const handler = new N8nErrorHandler();

    try {
        handler.validateConfig();

        switch (command) {
            case 'list':
                const workflows = await handler.listWorkflows();
                console.log('📋 Workflows:');
                workflows.forEach(wf => console.log(`  ${wf.id}: ${wf.name}`));
                break;

            case 'monitor':
                console.log('👀 Starting error monitoring...');
                await handler.monitorAndHandleErrors();
                break;

            case 'create-error-wf':
                const name = args[1] || 'Error Handler Workflow';
                const errorWf = await handler.createErrorWorkflow(name, {
                    nodes: [{
                        parameters: {
                            title: '🚨 Workflow Error Alert',
                            body: 'Error in workflow {{ $json.workflowId }}: {{ $json.error }}'
                        },
                        type: 'n8n-nodes-base.pushbullet',
                        typeVersion: 1,
                        position: [100, 100],
                        id: 'error-notification',
                        name: 'Error Notification'
                    }]
                });
                console.log(`✅ Created error workflow: ${errorWf.id}`);
                break;

            case 'add-error-handler':
                const workflowId = args[1];
                const errorWorkflowId = args[2];
                if (!workflowId || !errorWorkflowId) {
                    console.log('Usage: node error-handler.js add-error-handler <workflowId> <errorWorkflowId>');
                    process.exit(1);
                }
                await handler.addErrorHandlerToWorkflow(workflowId, errorWorkflowId);
                console.log(`✅ Added error handler to workflow ${workflowId}`);
                break;

            case 'save':
                const wfId = args[1];
                const filename = args[2] || `workflow-${wfId}.json`;
                await handler.saveWorkflowToFile(wfId, filename);
                break;

            default:
                console.log(`
🔧 N8n Error Handler Tool

Usage:
  node error-handler.js <command> [args...]

Commands:
  list                          List all workflows
  monitor                       Start error monitoring
  create-error-wf [name]        Create a basic error workflow
  add-error-handler <wfId> <errWfId>  Add error handler to workflow
  save <wfId> [filename]        Save workflow to JSON file

Environment Variables:
  N8N_BASE_URL                  n8n instance URL
  N8N_API_KEY                   n8n API key
                `);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = N8nErrorHandler;

// Run CLI if called directly
if (require.main === module) {
    main();
}