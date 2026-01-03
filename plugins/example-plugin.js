// plugins/example-plugin.js
module.exports = {
    name: 'example',
    description: 'Example plugin for demonstration',

    commands: {
        'hello': {
            description: 'Say hello',
            handler: async (args, admin) => {
                console.log('👋 Hello from example plugin!');
                console.log('Args:', args);
                console.log('Admin instance available:', !!admin);
            }
        },

        'status': {
            description: 'Show plugin status',
            handler: async (args, admin) => {
                console.log('✅ Example plugin is loaded and working');
                console.log('Plugin name:', this.name);
            }
        }
    }
};