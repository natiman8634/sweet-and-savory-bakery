import express from 'express';
import authRoutes from './routes/auth.routes.js';
import cors from 'cors';
import storeRoutes from './routes/store.routes.js';  

const app = express();



app.use(cors());
app.use(express.json()); 

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Bakery API is running!');
});

app.use('/api', storeRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message || 'Unknown error',
  });
});

export default app;