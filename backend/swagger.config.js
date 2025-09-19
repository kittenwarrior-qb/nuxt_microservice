const swaggerJSDoc = require('swagger-jsdoc');

// Get environment variables
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// Determine server configuration based on environment
const getServers = () => {
  const servers = [];
  
  console.log(`[Swagger] Environment: ${NODE_ENV}`);
  console.log(`[Swagger] Port: ${PORT}`);
  console.log(`[Swagger] API_BASE_URL: ${API_BASE_URL}`);
  console.log(`[Swagger] PRODUCTION_URL: ${process.env.PRODUCTION_URL || 'not set'}`);
  
  if (NODE_ENV === 'production') {
    // Production server
    if (process.env.PRODUCTION_URL) {
      servers.push({
        url: process.env.PRODUCTION_URL,
        description: 'Production server'
      });
      console.log(`[Swagger] Added production server: ${process.env.PRODUCTION_URL}`);
    }
    // Fallback to API_BASE_URL if PRODUCTION_URL not set
    if (API_BASE_URL && API_BASE_URL !== `http://localhost:${PORT}`) {
      servers.push({
        url: API_BASE_URL,
        description: 'Production server (fallback)'
      });
      console.log(`[Swagger] Added production fallback server: ${API_BASE_URL}`);
    }
  } else {
    // Development server
    servers.push({
      url: API_BASE_URL,
      description: 'Development server'
    });
    console.log(`[Swagger] Added development server: ${API_BASE_URL}`);
  }
  
  // Always include localhost as fallback for development
  if (NODE_ENV !== 'production') {
    servers.push({
      url: `http://localhost:${PORT}`,
      description: 'Local development server'
    });
    console.log(`[Swagger] Added localhost fallback: http://localhost:${PORT}`);
  }
  
  console.log(`[Swagger] Total servers configured: ${servers.length}`);
  return servers;
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TheGioiDiDong API',
      version: '1.0.0',
      description: 'API documentation for TheGioiDiDong e-commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@thegioididong.com'
      }
    },
    servers: getServers(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            firebase_uid: { type: 'string' },
            picture: { type: 'string' },
            email_verified: { type: 'boolean' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            price: { type: 'string' },
            price_old: { type: 'string' },
            percent: { type: 'string' },
            brand: { type: 'string' },
            category: { type: 'string' },
            img: { type: 'string' },
            rating: { type: 'string' },
            link: { type: 'string' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            link: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'integer' }
          }
        },
        Province: {
          type: 'object',
          properties: {
            code: { type: 'number' },
            codename: { type: 'string' },
            division_type: { type: 'string' },
            name: { type: 'string' },
            phone_code: { type: 'number' },
            districts: {
              type: 'array',
              items: { $ref: '#/components/schemas/Ward' }
            }
          }
        },
        Ward: {
          type: 'object',
          properties: {
            code: { type: 'number' },
            codename: { type: 'string' },
            division_type: { type: 'string' },
            name: { type: 'string' },
            province_code: { type: 'number' }
          }
        },
        LocationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: { type: 'string' }
          }
        },
        SearchResult: {
          type: 'object',
          properties: {
            display_name: { type: 'string' },
            lat: { type: 'string' },
            lon: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                house_number: { type: 'string' },
                road: { type: 'string' },
                suburb: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        }
      }
    },
    paths: {
      '/': {
        get: {
          summary: 'API Information',
          description: 'Get basic API information and available endpoints',
          responses: {
            '200': {
              description: 'API information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      version: { type: 'string' },
                      endpoints: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/health': {
        get: {
          summary: 'Health Check',
          description: 'Check API health status',
          responses: {
            '200': {
              description: 'Health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                      uptime: { type: 'number' },
                      services: { type: 'array', items: { type: 'string' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/register': {
        post: {
          summary: 'Register User',
          description: 'Register a new user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'firstName', 'lastName'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          summary: 'Login User',
          description: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/firebase': {
        post: {
          summary: 'Firebase Authentication',
          description: 'Verify Firebase ID token and sync user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: { type: 'string', description: 'Firebase ID token' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Token verified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Invalid token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          summary: 'Get Current User',
          description: 'Get current authenticated user information',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User information',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/products': {
        get: {
          summary: 'Get Products',
          description: 'Get list of products with optional filtering and pagination',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number'
            },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of items per page'
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category'
            },
            {
              name: 'brand',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by brand'
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search in product name'
            }
          ],
          responses: {
            '200': {
              description: 'List of products',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      rows: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' }
                      },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      pageSize: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/products/{id}': {
        get: {
          summary: 'Get Product by ID',
          description: 'Get detailed information about a specific product',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Product ID'
            }
          ],
          responses: {
            '200': {
              description: 'Product details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            },
            '404': {
              description: 'Product not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/products/new': {
        get: {
          summary: 'Get New Products',
          description: 'Get list of newest products',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of products to return'
            }
          ],
          responses: {
            '200': {
              description: 'List of new products',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Product' }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/categories': {
        get: {
          summary: 'Get Categories',
          description: 'Get list of all product categories',
          responses: {
            '200': {
              description: 'List of categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/categories/{id}': {
        get: {
          summary: 'Get Category by ID',
          description: 'Get detailed information about a specific category',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Category ID'
            }
          ],
          responses: {
            '200': {
              description: 'Category details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Category' }
                }
              }
            },
            '404': {
              description: 'Category not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/categories/{id}/products': {
        get: {
          summary: 'Get Products by Category',
          description: 'Get all products in a specific category',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Category ID'
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number'
            },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of items per page'
            }
          ],
          responses: {
            '200': {
              description: 'List of products in category',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      rows: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' }
                      },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      pageSize: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Category not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/provinces': {
        get: {
          summary: 'Get All Provinces',
          description: 'Get list of all provinces in Vietnam',
          tags: ['Location'],
          responses: {
            '200': {
              description: 'List of provinces',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Province' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/provinces/{code}': {
        get: {
          summary: 'Get Province by Code',
          description: 'Get specific province information by province code',
          tags: ['Location'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Province code'
            }
          ],
          responses: {
            '200': {
              description: 'Province information',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Province' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '404': {
              description: 'Province not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/wards': {
        get: {
          summary: 'Get All Wards',
          description: 'Get list of all wards/districts in Vietnam',
          tags: ['Location'],
          responses: {
            '200': {
              description: 'List of wards',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Ward' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/wards/{provinceCode}': {
        get: {
          summary: 'Get Wards by Province',
          description: 'Get all wards/districts in a specific province',
          tags: ['Location'],
          parameters: [
            {
              name: 'provinceCode',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Province code'
            },
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by division type (e.g., "Quận", "Huyện", "Phường", "Xã")'
            }
          ],
          responses: {
            '200': {
              description: 'List of wards in province',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Ward' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '404': {
              description: 'Province not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/ward/{code}': {
        get: {
          summary: 'Get Ward by Code',
          description: 'Get specific ward information by ward code',
          tags: ['Location'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'number' },
              description: 'Ward code'
            }
          ],
          responses: {
            '200': {
              description: 'Ward information',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Ward' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '404': {
              description: 'Ward not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/search': {
        get: {
          summary: 'Search Address',
          description: 'Search for addresses using Nominatim OpenStreetMap API with debounce support',
          tags: ['Location'],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Search query (address, place name, etc.)'
            }
          ],
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/SearchResult' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': {
              description: 'Missing search query',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/reverse': {
        get: {
          summary: 'Reverse Geocoding',
          description: 'Get address information from latitude and longitude coordinates',
          tags: ['Location'],
          parameters: [
            {
              name: 'lat',
              in: 'query',
              required: true,
              schema: { type: 'number' },
              description: 'Latitude coordinate'
            },
            {
              name: 'lon',
              in: 'query',
              required: true,
              schema: { type: 'number' },
              description: 'Longitude coordinate'
            }
          ],
          responses: {
            '200': {
              description: 'Address information',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/LocationResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/SearchResult' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': {
              description: 'Missing coordinates',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LocationResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/location/cache/clear': {
        post: {
          summary: 'Clear Location Cache',
          description: 'Clear the location service cache (admin only)',
          tags: ['Location'],
          responses: {
            '200': {
              description: 'Cache cleared successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

module.exports = swaggerJSDoc(options);
