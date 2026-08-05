import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'APILens Backend API Service',
      version: '1.0.0',
      description: 'Production-ready REST backend API documentation for APILens platform, supporting authentication, requests execution forwarding, collections, history logs, and computed statistics.',
      contact: {
        name: 'APILens Platform Development'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token here'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Paths to files containing OpenAPI documentation annotations
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

export const specs = swaggerJSDoc(options);
export default specs;
