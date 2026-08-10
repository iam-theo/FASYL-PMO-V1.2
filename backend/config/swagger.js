// import swaggerJsdoc from "swagger-jsdoc";

// const options = {
//     definition: {
//         openapi: "3.0.0",
//         info: {
//             title: "FASYL PMO API",
//             version: "1.0.0",
//             description: "Project Workflow Management API",
//         },

//         servers: [
//             {
//                 url: "http://localhost:5000/api/v1",
//             },
//         ],

//         components: {
//             securitySchemes: {
//                 bearerAuth: {
//                 type: "http",
//                 scheme: "bearer",
//                 bearerFormat: "JWT",
//                 },
//             },
//         },

//         security: [
//             {
//                 bearerAuth: [],
//             },
//         ],
//     },

//     apis: [
//         "./backend/modules/**/*.js",
//     ],
// };

// const swaggerSpec = swaggerJsdoc(options);

// export default swaggerSpec;

import "dotenv/config";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "FASYL PMO API",
      version: "1.0.0",
      description: "Project Workflow Management API",
    },

    servers: [
      {
        url: process.env.PUBLIC_API_URL || "http://localhost:5000/api/v1",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        Project: {
          type: "object",

          properties: {
            id: {
              type: "integer",
              example: 11780,
            },

            projectId: {
              type: "string",
              example: "PROJ-731443",
            },

            projectName: {
              type: "string",
              example: "Flexcube Migration",
            },

            clientName: {
              type: "string",
              example: "Premium Trust Bank",
            },

            productName: {
              type: "string",
              nullable: true,
            },

            description: {
              type: "string",
              nullable: true,
            },

            status: {
              type: "string",
              example: "ACTIVE",
            },

            workflowStatus: {
              type: "string",
              enum: [
                "UNASSIGNED",
                "LOCKED",
                "OPEN",
                "SUBMITTED",
                "APPROVED",
                "REJECTED",
                "COMPLETED",
              ],
            },

            progressPercent: {
              type: "number",
              example: 0,
            },

            currentStageOrder: {
              type: "integer",
              example: 0,
            },

            projectManagerId: {
              type: "integer",
              nullable: true,
            },

            source: {
              type: "string",
              example: "SALES",
            },

            resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  recordId: {
                    type: "string",
                    example: "EMP-419102",
                  },
                  firstName: {
                    type: "string",
                  },
                  lastName: {
                    type: "string",
                  },
                  email: {
                    type: "string",
                  },
                  staffId: {
                    type: "string",
                  },
                  phoneNumber: {
                    type: "string",
                  },
                  designation: {
                    type: "string",
                  },
                },
              },
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },

            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Report: {
          type: "object",

          properties: {
            id: {
              type: "integer",
              example: 1,
            },

            projectId: {
              type: "string",
              example: "PROJ-001",
            },

            stageId: {
              type: "integer",
              nullable: true,
              example: 2,
            },

            createdById: {
              type: "integer",
              nullable: true,
              example: 5,
            },

            title: {
              type: "string",
              example: "Quarter One Performance Report",
            },

            description: {
              type: "string",
              example: "Generated analytics report.",
            },

            type: {
              type: "string",
              example: "PROJECT",
            },

            format: {
              type: "string",
              example: "PDF",
            },

            content: {
              type: "string",
              nullable: true,
            },

            fileUrl: {
              type: "string",
              nullable: true,
            },

            fileName: {
              type: "string",
              nullable: true,
            },

            fileType: {
              type: "string",
              nullable: true,
            },

            periodStart: {
              type: "string",
              format: "date-time",
              nullable: true,
            },

            periodEnd: {
              type: "string",
              format: "date-time",
              nullable: true,
            },

            generatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        CreateReportRequest: {
          type: "object",

          required: ["projectId", "title", "format"],

          properties: {
            projectId: {
              type: "string",
            },

            stageId: {
              type: "integer",
            },

            createdById: {
              type: "integer",
            },

            title: {
              type: "string",
            },

            description: {
              type: "string",
            },

            type: {
              type: "string",
            },

            format: {
              type: "string",
            },

            content: {
              type: "string",
            },

            fileUrl: {
              type: "string",
            },

            fileName: {
              type: "string",
            },

            fileType: {
              type: "string",
            },

            periodStart: {
              type: "string",
              format: "date-time",
            },

            periodEnd: {
              type: "string",
              format: "date-time",
            },
          },
        },

        UpdateReportRequest: {
          type: "object",

          properties: {
            title: {
              type: "string",
            },

            description: {
              type: "string",
            },

            type: {
              type: "string",
            },

            format: {
              type: "string",
            },

            content: {
              type: "string",
            },

            fileUrl: {
              type: "string",
            },

            fileName: {
              type: "string",
            },

            fileType: {
              type: "string",
            },

            stageId: {
              type: "integer",
            },

            periodStart: {
              type: "string",
              format: "date-time",
            },

            periodEnd: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./backend/modules/**/*.js", "./backend/server.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
