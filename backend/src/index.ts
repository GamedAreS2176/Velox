import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { router } from './controllers/auth.js';

const prisma = new PrismaClient();
const app=express();

app.use(express.json());
app.use(router);

app.get('/',(req,res)=>{
    return res.status(200).json({ msg:"all good" });
});

// Test endpoint to verify DB connection
app.get('/test-db', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        return res.status(200).json({ 
            message: "DB connection successful", 
            users 
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ 
            message: "DB connection failed", 
            error: message 
        });
    }
});

app.listen(51214,()=>{
    console.log("server running on http://localhost:51214");
})