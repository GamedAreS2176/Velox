import express from 'express';

const app=express();

app.get('/',(req,res)=>{
    return res.status(200).json({ msg:"all good" });
});

app.listen(3000,()=>{
    console.log("server running on http://localhost:3000");
})