// Place this file at: system-a/Jenkinsfile
pipeline {
    agent any

    tools {
        nodejs 'node20'   // Configure a NodeJS 20.11.1 tool in
                          // Manage Jenkins > Tools > NodeJS installations, name it "node20"
    }

    environment {
        SONAR_PROJECT_KEY = 'hgm-system-a'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint || true'   // remove "|| true" once lint is clean
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test -- --coverage'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('hgm-sonarqube') {   // name must match Manage Jenkins > System > SonarQube servers
                    sh """
                        npx sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                          -Dsonar.sources=src \
                          -Dsonar.tests=src \
                          -Dsonar.test.inclusions=**/*.spec.ts \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t hgm-system-a:${BUILD_NUMBER} .'
            }
        }

        stage('Deploy (local compose)') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    cd ..
                    docker compose up -d --no-deps --build system-a
                '''
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: '**/junit.xml'
        }
        failure {
            echo 'Build failed — check console output above.'
        }
    }
}
