import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma=new PrismaClient();
const router=express.Router();

router.post('/auth/register',async (req,res)=>{
    if(!req.body.email || !req.body.password)
    return res.status(400).json({ msg:"error" });

    const { email,password }=req.body;
    try {
    const hashedPass=await bcrypt.hash(password,10);
    const user=await prisma.user.create({ data:{email,password:hashedPass} });
    return res.status(201).json({ id:user.id,email:user.email });
} catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(400).json({ msg: "Email already exists" });
    }
    return res.status(500).json({ msg: "Internal server error" });
}
});

router.post('/auth/login',async (req,res)=>{
    if(!req.body.email || !req.body.password)
    return res.status(400).json({ msg:"error" });

    const user=await prisma.user.findUnique({ where:{ email:req.body.email } });
    if(!user)
    return res.status(401).json({ msg:"user not found" });

    const match=await bcrypt.compare(req.body.password,user.password);
    if(!match)
    return res.status(401).json({ msg:"incorrect password" });

    const payload={
        sub:user.id,
        email:user.email
    };
    const token=jwt.sign(payload,process.env.JWT_SECRET!,{ expiresIn: '1h' });
    res.cookie('authToken',token,{
        httpOnly:true,
        secure:true,
        sameSite:'strict',
        maxAge:3600000,
        path:'/'
    });
    return res.status(200).json({ msg:"login successful" });
});

export { router };