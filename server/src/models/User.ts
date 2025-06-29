import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'auditor'], required: true }
});

export const User = mongoose.model('User', UserSchema);

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'auditor';
}

// Example: Store in a database (MongoDB/Postgres); here we use in-memory for demo
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    passwordHash: '$2a$10$2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2', // bcrypt hashed password
    role: 'admin'
  }
]; 