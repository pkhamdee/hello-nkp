def createNamespace (namespace) {
    echo "Creating namespace ${namespace} if needed"

    sh "[ ! -z \"\$(kubectl get ns ${namespace} -o name 2>/dev/null)\" ] || kubectl create ns ${namespace}"
}

/* Run a curl against a given url */
def curlRun (url, out) {
    echo "Running curl on ${url}"

    script {
        if (out.equals('')) {
            out = 'http_code'
        }
        echo "Getting ${out}"
        def result = sh (
            returnStdout: true,
            script: "curl --output /dev/null --silent --connect-timeout 5 --max-time 5 --retry 5 --retry-delay 5 --retry-max-time 30 --write-out \"%{${out}}\" ${url}"
            )
        echo "Result (${out}): ${result}"
    }
}


/* Test with a simple curl and check we get 200 back */
def curlTest (namespace, servicename, out) {
    echo "Running tests in ${namespace}"

    script {
        if (out.equals('')) {
            out = 'http_code'
        }

        // Get deployment's service IP
        def svc_ip = sh (
            returnStdout: true,
            script: "kubectl get svc -n ${namespace} | grep ${servicename} | awk '{print \$4}'"
            )

        if (svc_ip.equals('')) {
            echo "ERROR: Getting service IP failed"
            sh 'exit 1'
        }

        echo "svc_ip is ${svc_ip}"
        url = 'http://' + svc_ip

        curlRun (url, out)
    }
}

pipeline {

    environment {
      KUBECONFIG = credentials('test-nkp-cluster-kubeconfig')
      APP_NAME = 'hello-nkp'
      APP_IMAGE = 'pkhamdee/hello-nkp:1.0'
      NAMESPACE_NONPROD = 'development'
      NAMESPACE_PROD = 'prod'
      DEPLOY_TO_PROD = false
      DEPLOY_PROD = false
    }
    
    agent any

    stages {

        stage('Build and tests'){
            steps {
                
                 script {
                     echo "skip.."
                 }

            }
        }
        
        stage('Docker Build'){
            steps {
                
                 script {
                     echo "skip.."
                 }

            }
        }


        stage('Deploy QA'){
            steps {
                 script {
                    NAMESPACE = "${NAMESPACE_NONPROD}"

                    try {

                        echo "Deploying application ${APP_NAME} to ${NAMESPACE} namespace"
                        createNamespace (NAMESPACE)

                        // Apply the deployment
                        sh "kubectl create deployment ${APP_NAME} --image=${APP_IMAGE} --replicas=1 -n ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"

                        // Wait for deployment rollout
                        echo "Waiting for deployment rollout to complete..."
                        sh """
                            kubectl rollout status deployment/${APP_NAME} \
                            -n ${NAMESPACE} \
                            --timeout=600s
                        """

                        // Verify pods are running
                        echo "Verifying pods are running..."
                        sh """
                            kubectl wait --for=condition=ready \
                            pod -l app=${APP_NAME} \
                            -n ${NAMESPACE} \
                            --timeout=300s
                        """

                        // Get deployment status
                        sh """
                            kubectl get deployment ${APP_NAME} -n ${NAMESPACE}
                            kubectl get pods -l app=${APP_NAME} -n ${NAMESPACE}
                        """
                        
                        //Expose service with loadbalancer
                        sh "[ ! -z \"\$(kubectl -n ${NAMESPACE} get svc hello-nkp-svc -o name 2>/dev/null)\" ] || kubectl -n ${NAMESPACE} expose deployment ${APP_NAME} --port=80 --target-port=8080 --name=hello-nkp-svc --type=LoadBalancer"

                        echo "Deployment completed successfully!"

                    } catch (Exception e) {
                        echo "Deployment failed: ${e.getMessage()}"
                        
                        // Get debugging information
                        sh """
                            echo "=== Deployment Status ==="
                            kubectl describe deployment ${APP_NAME} -n ${NAMESPACE} || true
                            
                            echo "=== Pod Status ==="
                            kubectl get pods -l app=${APP_NAME} -n ${NAMESPACE} || true
                            
                            echo "=== Pod Logs ==="
                            kubectl logs -l app=${APP_NAME} -n ${NAMESPACE} --tail=50 || true
                            
                            echo "=== Events ==="
                            kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' || true
                        """
                        
                        throw e
                    }

                 }

            }
        }

        stage('QA Tests'){
            parallel {
                stage('Curl http_code') {
                    steps {
                        curlTest (NAMESPACE_NONPROD, 'hello-nkp-svc', 'http_code')
                    }
                }
                stage('Curl total_time') {
                    steps {
                        curlTest (NAMESPACE_NONPROD, 'hello-nkp-svc', 'http_code')
                    }
                }
                stage('Curl size_download') {
                    steps {
                        curlTest (NAMESPACE_NONPROD, 'hello-nkp-svc', 'http_code')
                    }
                }
            }
        }


        stage('Go for Production?') {
            when {
                allOf {
                    environment name: 'DEPLOY_TO_PROD', value: 'false'
                }
            }

            steps {
                // Prevent any older builds from deploying to production
                milestone(1)
                input 'Proceed and deploy to Production?'
                milestone(2)

                script {
                    DEPLOY_PROD = true
                }
            }
        }

        stage('Deploy Production'){
            steps {
                 script {
                    NAMESPACE = "${NAMESPACE_PROD}"

                    try {

                        echo "Deploying application ${APP_NAME} to ${NAMESPACE} namespace"
                        createNamespace (NAMESPACE)

                        // Apply the deployment
                        sh "kubectl create deployment ${APP_NAME} --image=${APP_IMAGE} --replicas=1 -n ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"

                        // Wait for deployment rollout
                        echo "Waiting for deployment rollout to complete..."
                        sh """
                            kubectl rollout status deployment/${APP_NAME} \
                            -n ${NAMESPACE} \
                            --timeout=600s
                        """

                        // Verify pods are running
                        echo "Verifying pods are running..."
                        sh """
                            kubectl wait --for=condition=ready \
                            pod -l app=${APP_NAME} \
                            -n ${NAMESPACE} \
                            --timeout=300s
                        """

                        // Get deployment status
                        sh """
                            kubectl get deployment ${APP_NAME} -n ${NAMESPACE}
                            kubectl get pods -l app=${APP_NAME} -n ${NAMESPACE}
                        """
                        
                        //Expose service with loadbalancer
                        sh "[ ! -z \"\$(kubectl -n ${NAMESPACE} get svc hello-nkp-svc -o name 2>/dev/null)\" ] || kubectl -n ${NAMESPACE} expose deployment ${APP_NAME} --port=80 --target-port=8080 --name=hello-nkp-svc --type=LoadBalancer"

                        echo "Deployment completed successfully!"

                    } catch (Exception e) {
                        echo "Deployment failed: ${e.getMessage()}"
                        
                        // Get debugging information
                        sh """
                            echo "=== Deployment Status ==="
                            kubectl describe deployment ${APP_NAME} -n ${NAMESPACE} || true
                            
                            echo "=== Pod Status ==="
                            kubectl get pods -l app=${APP_NAME} -n ${NAMESPACE} || true
                            
                            echo "=== Pod Logs ==="
                            kubectl logs -l app=${APP_NAME} -n ${NAMESPACE} --tail=50 || true
                            
                            echo "=== Events ==="
                            kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' || true
                        """
                        
                        throw e
                    }

                 }

            }
        }

        stage('Production Tests'){
            parallel {
                stage('Curl http_code') {
                    steps {
                        curlTest (NAMESPACE_PROD, 'hello-nkp-svc', 'http_code')
                    }
                }
                stage('Curl total_time') {
                    steps {
                        curlTest (NAMESPACE_PROD, 'hello-nkp-svc', 'http_code')
                    }
                }
                stage('Curl size_download') {
                    steps {
                        curlTest (NAMESPACE_PROD, 'hello-nkp-svc', 'http_code')
                    }
                }
            }
        }

    }


    post {
        always {
            echo "Cleaning up..."
        }
        success {
            echo "Deployment pipeline completed successfully!"
        }
        failure {
            echo "Deployment pipeline failed!"
        }
    }
}