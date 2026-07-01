import { prisma } from '../db.js';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {

    console.log("Request Body:", req.body); 
  
  if (!req.body) {
    return res.status(400).json({ error: "Body is missing or not parsed" });
  }

  const { email, password, full_name, phone, default_address } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Transaction ensures atomicity
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: { email, password: hashedPassword, role_id: 3 }, // Assuming 3 = Customer
      });
      await tx.customerProfiles.create({
        data: { user_id: user.id, full_name, phone, default_address },
      });
      return user;
    });

    res.status(201).json({ message: 'Registration successful', userId: result.id });
  } catch (error) {
    console.error("Registration Error:", error); // Log the real error to your terminal
    res.status(400).json({ error: 'Registration failed', details: error instanceof Error ? error.message : error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error("Login Error Details:", error); 
    res.status(500).json({ error: 'Login failed', details: error instanceof Error ? error.message : error });
  }
};

