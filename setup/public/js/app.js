function setupWizard() {
    return {
        currentStep: 1,
        totalSteps: 5,
        deploying: false,
        deploymentLogs: '',
        validationMessages: {},
        config: {
            deploymentType: 'local',
            PUID: '1000',
            PGID: '1000',
            TZ: 'Etc/UTC',
            CUSTOM_PORT: '8080',
            CUSTOM_HTTPS_PORT: '8443',
            DOMAIN: '',
            CADDY_EMAIL: '',
            AUTH_OIDC_ISSUER_URL: '',
            AUTH_CLIENT_ID: '',
            AUTH_CLIENT_SECRET: '',
            AUTH_COOKIE_SECRET: '',
            AUTH_EMAIL_DOMAINS: '*',
            AUTH_REDIRECT_URL: '',
            AUTH_COOKIE_SECURE: 'true'
        },

        init() {
            // Load saved progress from localStorage
            const saved = localStorage.getItem('wizardProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.config = { ...this.config, ...data.config };
                this.currentStep = data.currentStep || 1;
            }
        },

        nextStep() {
            // Validate current step before proceeding
            if (this.currentStep === 2) {
                this.validateBasicSettings();
            }

            // Skip production steps if local deployment
            if (this.config.deploymentType === 'local') {
                if (this.currentStep === 2) {
                    this.currentStep = 5; // Jump to review
                    return;
                }
            }

            // Skip auth step if not production-auth
            if (this.config.deploymentType === 'production') {
                if (this.currentStep === 3) {
                    this.currentStep = 5; // Jump to review
                    return;
                }
            }

            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.saveProgress();
            }
        },

        previousStep() {
            // Navigate backwards considering skipped steps
            if (this.currentStep === 5 && this.config.deploymentType === 'local') {
                this.currentStep = 2;
                return;
            }

            if (this.currentStep === 5 && this.config.deploymentType === 'production') {
                this.currentStep = 3;
                return;
            }

            if (this.currentStep > 1) {
                this.currentStep--;
                this.saveProgress();
            }
        },

        saveProgress() {
            localStorage.setItem('wizardProgress', JSON.stringify({
                currentStep: this.currentStep,
                config: this.config
            }));
        },

        async validateBasicSettings() {
            try {
                const response = await fetch('/api/validate/basic', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        puid: this.config.PUID,
                        pgid: this.config.PGID,
                        tz: this.config.TZ,
                        customPort: this.config.CUSTOM_PORT
                    })
                });

                const result = await response.json();
                if (!result.valid) {
                    alert('Validation errors: ' + result.errors.map(e => e.message).join(', '));
                }
            } catch (error) {
                console.error('Validation error:', error);
            }
        },

        async validateDomain() {
            try {
                const response = await fetch('/api/validate/domain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        domain: this.config.DOMAIN,
                        email: this.config.CADDY_EMAIL
                    })
                });

                const result = await response.json();
                console.log('DNS Validation result:', result); // Debug log

                if (result.valid) {
                    this.validationMessages.domain = '<p style="color: green;">✓ DNS validation passed!</p>';
                    if (result.warnings && result.warnings.length > 0) {
                        this.validationMessages.domain += '<p style="color: orange;">Warnings:</p><ul>' +
                            result.warnings.map(w => `<li>${w.message}</li>`).join('') +
                            '</ul>';
                    }
                } else {
                    this.validationMessages.domain = '<p style="color: red;">✗ Validation failed:</p><ul>' +
                        result.errors.map(e => `<li>${e.message}</li>`).join('') +
                        '</ul>';
                }
            } catch (error) {
                console.error('Validation error:', error); // Debug log
                this.validationMessages.domain = '<p style="color: red;">✗ Validation error: ' + error.message + '</p>';
            }
        },

        generateCookieSecret() {
            // Generate a 32-byte base64 secret
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            this.config.AUTH_COOKIE_SECRET = btoa(String.fromCharCode.apply(null, array));
        },

        async deploy() {
            this.deploying = true;
            this.deploymentLogs = 'Starting deployment...\n';

            try {
                // Save configuration
                this.deploymentLogs += 'Saving configuration...\n';
                const saveResponse = await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        config: this.config,
                        deploymentType: this.config.deploymentType
                    })
                });

                if (!saveResponse.ok) {
                    throw new Error('Failed to save configuration');
                }

                this.deploymentLogs += '✓ Configuration saved\n';

                // Determine compose file and profiles
                let composeFile = 'docker-compose.yml';
                let profiles = [];

                if (this.config.deploymentType === 'production') {
                    composeFile = 'docker-compose.production.yml';
                    // No auth profile - oauth2-proxy won't start
                } else if (this.config.deploymentType === 'production-auth') {
                    composeFile = 'docker-compose.production.yml';
                    profiles = ['auth']; // Enable auth profile for oauth2-proxy
                }

                // Build services
                this.deploymentLogs += '\nBuilding Docker images...\n';
                const buildResponse = await fetch('/api/deploy/build', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ composeFile })
                });

                const buildResult = await buildResponse.json();
                this.deploymentLogs += buildResult.logs || buildResult.message;
                if (buildResult.errors) {
                    this.deploymentLogs += '\n' + buildResult.errors;
                }

                // Start services
                this.deploymentLogs += '\nStarting services...\n';
                this.deploymentLogs += `Deployment type: ${this.config.deploymentType}\n`;
                this.deploymentLogs += `Profiles: ${profiles.length > 0 ? profiles.join(', ') : 'none'}\n`;

                const startResponse = await fetch('/api/deploy/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ composeFile, profiles })
                });

                const startResult = await startResponse.json();
                this.deploymentLogs += startResult.logs || startResult.message;
                if (startResult.errors) {
                    this.deploymentLogs += '\nErrors:\n' + startResult.errors;
                }

                // Show more details if available
                console.log('Start result:', startResult);

                if (startResult.success) {
                    this.deploymentLogs += '\n\n✓ Deployment completed successfully!\n';
                    this.deploymentLogs += '\nYour Obsidian Remote instance is now running.\n';

                    if (this.config.DOMAIN) {
                        this.deploymentLogs += `\nAccess at: https://${this.config.DOMAIN}\n`;
                    } else {
                        this.deploymentLogs += `\nAccess at: http://localhost:${this.config.CUSTOM_PORT}\n`;
                    }

                    // Clear saved progress
                    localStorage.removeItem('wizardProgress');
                } else {
                    this.deploymentLogs += '\n\n✗ Deployment failed. Check logs above for errors.\n';
                }
            } catch (error) {
                this.deploymentLogs += `\n\n✗ Error: ${error.message}\n`;
            } finally {
                this.deploying = false;
            }
        }
    };
}
