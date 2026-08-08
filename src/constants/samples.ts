export interface SampleData {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLE_DATA: SampleData[] = [
  {
    id: 'users-api',
    name: 'Users API response',
    description: 'Array of user objects with nested profile data',
    content: JSON.stringify(
      [
        {
          id: 1,
          name: 'Maria Santos',
          email: 'maria.santos@example.com',
          age: 32,
          isActive: true,
          createdAt: '2024-03-15T09:30:00Z',
          profile: { role: 'admin', department: 'Engineering', skills: ['typescript', 'react', 'node'] },
        },
        {
          id: 2,
          name: 'John Reyes',
          email: 'john.reyes@example.com',
          age: 41,
          isActive: false,
          createdAt: '2023-11-02T14:15:00Z',
          profile: { role: 'user', department: 'Sales', skills: ['sql', 'excel'] },
        },
        {
          id: 3,
          name: 'Aisha Khan',
          email: 'aisha.khan@example.com',
          age: 27,
          isActive: true,
          createdAt: '2024-07-21T18:45:00Z',
          profile: { role: 'user', department: 'Design', skills: ['figma', 'css', 'react'] },
        },
      ],
      null,
      2,
    ),
  },
  {
    id: 'orders-api',
    name: 'Order / pagination response',
    description: 'Typical paged API payload',
    content: JSON.stringify(
      {
        success: true,
        pagination: { page: 1, perPage: 20, total: 153, totalPages: 8 },
        data: [
          { orderId: 'ORD-1042', customer: 'Lena Müller', total: 129.99, status: 'shipped', items: 3 },
          { orderId: 'ORD-1041', customer: 'Omar Haddad', total: 45.5, status: 'processing', items: 1 },
          { orderId: 'ORD-1040', customer: 'Wei Chen', total: 899.0, status: 'delivered', items: 5 },
        ],
        links: { next: '/api/orders?page=2', previous: null },
      },
      null,
      2,
    ),
  },
  {
    id: 'error-response',
    name: 'Error response',
    description: 'Standard API error envelope',
    content: JSON.stringify(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request could not be processed because it contains invalid fields.',
          status: 422,
          details: [
            { field: 'email', message: 'Must be a valid email address', path: '$.email' },
            { field: 'age', message: 'Must be a number between 18 and 120', path: '$.age' },
          ],
        },
        requestId: 'req_8f2c91a4',
        timestamp: '2024-08-01T10:12:33Z',
      },
      null,
      2,
    ),
  },
  {
    id: 'auth-response',
    name: 'Authentication response',
    description: 'JWT-style auth payload',
    content: JSON.stringify(
      {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1hcmlhIFNhbnRvcyIsImlhdCI6MTcyMjUwMDAwMCwiZXhwIjoxNzIyNTg2NDAwfQ.sample-signature',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: { id: 123, name: 'Maria Santos', email: 'maria.santos@example.com', role: 'admin' },
        permissions: ['orders.read', 'orders.write', 'users.read'],
      },
      null,
      2,
    ),
  },
  {
    id: 'app-config',
    name: 'Configuration JSON',
    description: 'Application config with nested sections',
    content: JSON.stringify(
      {
        app: { name: 'payment-service', port: 8080, environment: 'production', debug: false },
        database: { host: 'db.internal', port: 5432, name: 'payments', poolSize: 10, ssl: true },
        cache: { provider: 'redis', host: 'redis.internal', ttlSeconds: 300 },
        features: { enableWebhooks: true, enableRefunds: false, maxRetries: 3 },
        logging: { level: 'info', format: 'json', output: 'stdout' },
      },
      null,
      2,
    ),
  },
  {
    id: 'docker-compose',
    name: 'Docker configuration',
    description: 'Docker Compose service definition',
    content: JSON.stringify(
      {
        version: '3.9',
        services: {
          api: { build: '.', ports: ['3000:3000'], environment: { NODE_ENV: 'production' }, depends_on: ['db'] },
          db: { image: 'postgres:16', environment: { POSTGRES_DB: 'app', POSTGRES_USER: 'app' }, volumes: ['pgdata:/var/lib/postgresql/data'] },
        },
        volumes: { pgdata: null },
      },
      null,
      2,
    ),
  },
  {
    id: 'k8s-manifest',
    name: 'Kubernetes configuration',
    description: 'Deployment + service manifest',
    content: JSON.stringify(
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'api-server', labels: { app: 'api' } },
        spec: {
          replicas: 3,
          selector: { matchLabels: { app: 'api' } },
          template: {
            metadata: { labels: { app: 'api' } },
            spec: {
              containers: [
                { name: 'api', image: 'registry.example/api:1.2.3', ports: [{ containerPort: 8080 }], resources: { limits: { cpu: '500m', memory: '512Mi' } } },
              ],
            },
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: 'ci-pipeline',
    name: 'CI/CD configuration',
    description: 'Pipeline stages definition',
    content: JSON.stringify(
      {
        name: 'build-and-deploy',
        on: { push: { branches: ['main'] } },
        jobs: {
          test: { runsOn: 'ubuntu-latest', steps: [{ uses: 'actions/checkout@v4' }, { run: 'npm ci' }, { run: 'npm test' }] },
          deploy: { runsOn: 'ubuntu-latest', needs: ['test'], steps: [{ uses: 'actions/checkout@v4' }, { run: 'npm run build' }] },
        },
      },
      null,
      2,
    ),
  },
  {
    id: 'microservice',
    name: 'Microservice response',
    description: 'Nested service-to-service payload',
    content: JSON.stringify(
      {
        service: 'inventory-service',
        version: '2.4.1',
        items: [
          { sku: 'SKU-1001', name: 'Wireless Mouse', price: 24.99, stock: 120, categories: ['peripherals', 'wireless'] },
          { sku: 'SKU-1002', name: 'Mechanical Keyboard', price: 89.5, stock: 45, categories: ['peripherals'] },
        ],
        metadata: { requestedBy: 'order-service', traceId: 'trace-abc123' },
      },
      null,
      2,
    ),
  },
  {
    id: 'json-schema',
    name: 'JSON Schema',
    description: 'Draft-07 schema example',
    content: JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        title: 'User',
        required: ['id', 'name', 'email'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 18, maximum: 120 },
          role: { type: 'string', enum: ['admin', 'user', 'guest'] },
          tags: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        },
        additionalProperties: true,
      },
      null,
      2,
    ),
  },
  {
    id: 'geo-data',
    name: 'Nested geo data',
    description: 'GeoJSON-style structure for depth exploration',
    content: JSON.stringify(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [120.9842, 14.5995] },
            properties: { name: 'Manila', country: 'PH', population: 1780148 },
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [121.0737, 14.5995] },
            properties: { name: 'Makati', country: 'PH', population: 582602 },
          },
        ],
      },
      null,
      2,
    ),
  },
];
